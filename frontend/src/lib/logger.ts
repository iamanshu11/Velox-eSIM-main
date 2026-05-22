type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class FrontendLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private safeStringify(data: any): string {
    const seen = new WeakSet();

    try {
      return JSON.stringify(data, (_key, value) => {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
            ...(value as any),
          };
        }

        if (typeof value === 'function') {
          return `[Function: ${value.name || 'anonymous'}]`;
        }

        if (typeof value === 'symbol') {
          return value.toString();
        }

        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }

        return value;
      }, 2);
    } catch {
      try {
        return String(data);
      } catch {
        return '[Unable to stringify]';
      }
    }
  }

  private safeLog(_logFn: (...args: any[]) => void, ..._args: any[]) {
    return;
  }

  private extractObjectProperties(data: any): any {
    const result: Record<string, any> = {};
    const seenKeys = new Set<string | symbol>();
    let current = data;

    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach((key) => seenKeys.add(key));
      Object.getOwnPropertySymbols(current).forEach((symbol) => seenKeys.add(symbol));
      current = Object.getPrototypeOf(current);
    }

    for (const key of seenKeys) {
      try {
        const value = (data as any)[key];
        if (value instanceof Error) {
          result[String(key)] = {
            name: value.name,
            message: value.message,
            stack: value.stack,
            ...(value as any),
          };
        } else {
          result[String(key)] = value;
        }
      } catch {
        result[String(key)] = '[Unable to read]';
      }
    }

    if (Object.keys(result).length > 0) {
      return result;
    }

    return {
      _type: data?.constructor?.name || 'Object',
      _proto: Object.getPrototypeOf(data)?.constructor?.name || null,
      _stringified: this.safeStringify(data),
      raw: data,
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (this.isDevelopment) {
      const logFn = level === 'error' ? console.error : 
                    level === 'warn' ? console.warn :
                    level === 'debug' ? console.debug :
                    console.log;
      
      if (data) {
        if (data instanceof Error) {
          const errorData = {
            name: data.name,
            message: data.message,
            stack: data.stack,
            ...(data as any),
          };
          this.safeLog(logFn, prefix, message, errorData);
        } else if (typeof data === 'object' && data !== null) {
          try {
            const displayData = this.extractObjectProperties(data);
            const hasDisplayKeys = Object.keys(displayData).length > 0;

            if (hasDisplayKeys) {
              const serialized = this.safeStringify(displayData);
              this.safeLog(logFn, prefix, message, displayData);
              this.safeLog(logFn, prefix, "[Logger] serialized payload", serialized);
            } else {
              const payload = {
                _type: data?.constructor?.name || 'Object',
                _proto: Object.getPrototypeOf(data)?.constructor?.name || null,
                _keys: Object.getOwnPropertyNames(data),
                _symbols: Object.getOwnPropertySymbols(data).map((symbol) => symbol.toString()),
                message: data?.message || undefined,
                name: data?.name || undefined,
                stack: data?.stack || undefined,
                _stringified: this.safeStringify(data),
                raw: data,
              };
              this.safeLog(logFn, prefix, message, payload);
              this.safeLog(logFn, prefix, "[Logger] serialized payload", this.safeStringify(payload));
            }
          } catch (e) {
            this.safeLog(logFn, prefix, message, String(data));
          }
        } else {
          this.safeLog(logFn, prefix, message, data);
        }
      } else {
        this.safeLog(logFn, prefix, message);
      }
    } else {
      if (level === 'error') {
        try {
        } catch (e) {
        }
      }
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    let logMessage = message;
    
    if (error) {
      const errorMessage = error?.message || String(error);
      const errorStatus = error?.status || error?.statusCode;
      const errorCode = error?.code;
      const details: string[] = [];
      if (errorMessage) details.push(errorMessage);
      if (errorStatus) details.push(`status: ${errorStatus}`);
      if (errorCode) details.push(`code: ${errorCode}`);
      
      if (details.length > 0) {
        logMessage = `${message} (${details.join(', ')})`;
      }
    }
    
    this.log('error', logMessage);
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }
}

export default new FrontendLogger();
