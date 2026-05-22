import fs from 'fs'
import path from 'path'

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  userId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
}
const SENSITIVE_PATTERNS = {
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  cvv: /\b(cvv|cvc|cvc2|cvv2)\s*:\s*\d{3,4}\b/gi,
  password: /\b(password|passwd|pwd)\s*:\s*[^\s,}]+/gi,
  token: /\b(authorization|auth|token|bearer)\s*:\s*[^\s,}]+/gi,
  apiKey: /\b(api[_-]?key|apikey|secret)\s*:\s*[^\s,}]+/gi,
  jwt: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
}

class Logger {
  private logDir = path.join(process.cwd(), 'logs')

  private sanitize(data: unknown): unknown {
    if (!data) return data

    if (typeof data === 'string') {
      let sanitized = data
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, '****-****-****-****')
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.cvv, 'CVV: ***')
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.password, 'password: ***')
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.token, 'token: ***')
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.apiKey, 'apiKey: ***')
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.jwt, '[JWT_TOKEN_REDACTED]')
      return sanitized
    }

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitize(item))
      }

      const sanitized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('key') ||
          lowerKey.includes('cvv') ||
          lowerKey.includes('cvc') ||
          lowerKey.includes('card')
        ) {
          sanitized[key] = '[REDACTED]'
          continue
        }
        if (typeof value === 'string' || typeof value === 'object') {
          sanitized[key] = this.sanitize(value)
        } else {
          sanitized[key] = value
        }
      }

      return sanitized
    }

    return data
  }

  constructor() {
    this.ensureLogDirectory()
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private getLogFileName(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0]
    return path.join(this.logDir, `${level.toLowerCase()}-${date}.log`)
  }

  private formatLogEntry(entry: LogEntry): string {
    const sanitizedData = entry.data ? this.sanitize(entry.data) : undefined
    return `[${entry.timestamp}] [${entry.level}] ${entry.message} ${
      sanitizedData ? JSON.stringify(sanitizedData) : ''
    }\n`
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const logFile = this.getLogFileName(entry.level)
      const formattedEntry = this.formatLogEntry(entry)
      fs.appendFileSync(logFile, formattedEntry)
    } catch (error) {
      if (process.stderr) {
        process.stderr.write(`[LOGGER_ERROR] Failed to write log file\n`)
      }
    }
  }

  async saveToDatabase(
    userId: string,
    action: string,
    entity: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const { db } = await import('../config/database')
      
      await db.activityLog.create({
        data: {
          userId,
          action,
          resource: entity,
          details: JSON.stringify(details || {}),
        },
      })
    } catch (error) {
      if (process.stderr) {
        process.stderr.write(`[LOGGER_ERROR] Failed to save activity log\n`)
      }
    }
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: Partial<LogEntry>): void {
    const sanitizedData = data ? this.sanitize(data) : data

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: sanitizedData,
      ...context,
    }
    const colors = {
      INFO: '\x1b[36m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      DEBUG: '\x1b[35m',
      SUCCESS: '\x1b[32m',
      RESET: '\x1b[0m',
    }

    const color = colors[level]
    const time = new Date().toLocaleTimeString()
    console.log(`${color}[${time}] [${level}] ${message}${colors.RESET}`, sanitizedData || '')
    this.writeToFile(entry)
  }

  info(message: string, data?: unknown, context?: Partial<LogEntry>): void {
    this.log('INFO', message, data, context)
  }

  warn(message: string, data?: unknown, context?: Partial<LogEntry>): void {
    this.log('WARN', message, data, context)
  }

  error(message: string, data?: unknown, context?: Partial<LogEntry>): void {
    this.log('ERROR', message, data, context)
  }

  debug(message: string, data?: unknown, context?: Partial<LogEntry>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data, context)
    }
  }

  success(message: string, data?: unknown, context?: Partial<LogEntry>): void {
    this.log('SUCCESS', message, data, context)
  }
  logRequest(method: string, url: string, statusCode: number, duration: number, ip?: string): void {
    this.info(
      `${method} ${url} - ${statusCode}`,
      { duration: `${duration}ms` },
      { ip }
    )
  }
  logDatabaseOperation(
    operation: string,
    entity: string,
    success: boolean,
    duration: number
  ): void {
    const message = `Database ${operation} on ${entity} - ${success ? 'SUCCESS' : 'FAILED'}`
    success ? this.success(message, { duration: `${duration}ms` }) : this.error(message, { duration: `${duration}ms` })
  }
  logAuthentication(email: string, success: boolean, ip?: string): void {
    const message = `Authentication attempt for ${email} - ${success ? 'SUCCESS' : 'FAILED'}`
    success ? this.success(message, {}, { ip }) : this.warn(message, {}, { ip })
  }
  logPayment(
    transactionId: string,
    amount: number,
    status: string,
    method: string
  ): void {
    this.info(`Payment ${transactionId}`, {
      amount,
      status,
      method,
    })
  }
  errorWithStack(message: string, error: Error, context?: Partial<LogEntry>): void {
    this.error(message, {
      errorMessage: error.message,
      stack: error.stack,
    }, context)
  }
  logPerformance(operation: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      this.warn(`Slow operation: ${operation}`, { duration: `${duration}ms` })
    } else {
      this.debug(`Operation: ${operation}`, { duration: `${duration}ms` })
    }
  }
}

export default new Logger()
