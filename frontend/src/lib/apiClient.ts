const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
let isRefreshing = false;
let failedQueue: any[] = [];
const pendingRequests = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;
const CACHE_TTL = 10 * 60 * 1000;
if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of pendingRequests.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        pendingRequests.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.debug(`[API Client] Cleaned up ${cleaned} stale cache entries`);
    }
  }, CACHE_CLEANUP_INTERVAL);
}
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 100,
  MAX_DELAY_MS: 5000,
  BACKOFF_MULTIPLIER: 2,
};
const REQUEST_TIMEOUT_MS = 30000;

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

const processQueue = (error: any, token: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};
const getCacheKey = (endpoint: string, options: ApiRequestOptions = {}): string => {
  const method = options.method || 'GET';
  const bodyStr = options.body ? String(options.body) : '';
  const timeoutSuffix = typeof options.timeoutMs === 'number' ? `:${options.timeoutMs}` : '';
  return `${method}:${endpoint}:${bodyStr}${timeoutSuffix}`;
};
const getRetryDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY_MS);
};
const createTimeoutPromise = <T>(ms: number): Promise<T> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });
};
const isRetryableError = (error: any, status?: number): boolean => {
  if (error.message?.includes('Failed to fetch')) return true;
  if (error.message?.includes('timeout')) return true;
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  if (status && retryableStatuses.includes(status)) return true;
  
  return false;
};
const isDeduplicatable = (method?: string): boolean => {
  return (method || 'GET').toUpperCase() === 'GET';
};

export const apiClient = {
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
    retried = false,
    retryAttempt = 0,
  ): Promise<T> {
    let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    if (!path.startsWith("/api/")) {
      path = `/api${path}`;
    }
    const url = `${API_URL}${path}`;
    const { timeoutMs = REQUEST_TIMEOUT_MS, ...requestOptions } = options;
    const cacheKey = getCacheKey(path, options);
    if (isDeduplicatable(requestOptions.method) && pendingRequests.has(cacheKey)) {
      const cached = pendingRequests.get(cacheKey);
      if (cached) {
        return cached.promise as Promise<T>;
      }
    }

    const isFormData = requestOptions.body instanceof FormData;
    const headers: any = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(typeof requestOptions.headers === "object" && requestOptions.headers
        ? requestOptions.headers
        : {}),
    };

    const fetchPromise = Promise.race([
      (async () => {
        try {
          const response = await fetch(url, {
            ...requestOptions,
            headers,
            credentials: "include",
          });

          const isAuthEndpoint =
            path.includes("/auth/login") ||
            path.includes("/auth/register") ||
            path.includes("/auth/refresh") ||
            path.includes("/auth/profile");
          
          if (response.status === 401 && !retried && !isAuthEndpoint) {
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then(() => this.request<T>(endpoint, options, true, retryAttempt))
                .catch((error) => {
                  throw error;
                });
            }

            isRefreshing = true;

            try {
              const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
              });

              if (refreshResponse.ok) {
                processQueue(null, true);
                return this.request<T>(endpoint, options, true, retryAttempt);
              } else {
                processQueue(new Error("Session expired"), null);
                const error: any = new Error("Session expired. Please login again.");
                error.code = "AUTH_REQUIRED";
                throw error;
              }
            } catch (error) {
              processQueue(error, null);
              throw error;
            }
          }

          if (!response.ok) {
            let errorMessage = `API Error: ${response.statusText}`;

            try {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                errorMessage = 
                  errorData?.error?.message || 
                  errorData?.message ||        
                  errorData?.error ||          
                  errorMessage;                
              }
            } catch (parseError) {
            }

            const error: any = new Error(errorMessage);
            error.status = response.status;
            error.statusCode = response.status;
            throw error;
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error(
              "Invalid response: expected JSON but received " +
                (contentType || "unknown format"),
            );
          }

          return await response.json();
        } catch (error: any) {
          if (isRetryableError(error, error.status) && retryAttempt < RETRY_CONFIG.MAX_RETRIES) {
            const delay = getRetryDelay(retryAttempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.request<T>(endpoint, options, retried, retryAttempt + 1);
          }
          if (error.message.includes("Failed to fetch")) {
            throw new Error(
              `Cannot connect to API at ${API_URL}. Make sure the backend server is running.`,
            );
          }
          throw error;
        }
      })(),
      createTimeoutPromise<T>(timeoutMs),
    ]);

    if (isDeduplicatable(options.method)) {
      const cacheEntry = { promise: fetchPromise, timestamp: Date.now() };
      pendingRequests.set(cacheKey, cacheEntry);
      fetchPromise
        .then(() => {
          try {
            pendingRequests.delete(cacheKey);
          } catch (e) {
          }
        })
        .catch(() => {
          try {
            pendingRequests.delete(cacheKey);
          } catch (e) {
          }
        });
    }

    return fetchPromise;
  },

  get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data !== undefined ? (isFormData ? data : JSON.stringify(data)) : undefined,
    });
  },

  put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data !== undefined ? (isFormData ? data : JSON.stringify(data)) : undefined,
    });
  },

  patch<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data !== undefined ? (isFormData ? data : JSON.stringify(data)) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  },
};

export default apiClient;
