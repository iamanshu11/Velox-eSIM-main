export interface BackendApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface BackendPaginatedResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
}
export function extractResponseData<T>(response: BackendApiResponse<T> | undefined): T | undefined {
  if (!response || !response.success) {
    return undefined;
  }
  return response.data;
}
export function extractPaginatedData<T>(
  response: BackendPaginatedResponse<T> | undefined
): T[] {
  if (!response || !response.success || !response.data) {
    return [];
  }
  return response.data;
}

export default {
  extractResponseData,
  extractPaginatedData,
};
