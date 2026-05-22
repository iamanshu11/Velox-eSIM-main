import { AppError } from './errors'

interface GenerateQRCodeParams {
  data: string
  size?: number
}

interface PaginationParams {
  page?: number
  limit?: number
}

interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

class UtilityService {
async generateQRCode({ data, size = 200 }: GenerateQRCodeParams): Promise<string> {
    try {
      const QRCode = require('qrcode')
      const qrCode = await QRCode.toDataURL(data, {
        width: size,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      return qrCode
    } catch (error) {
      throw new AppError(500, 'Failed to generate QR code')
    }
  }
async paginate<T>(
    query: unknown,
    params: PaginationParams = {}
  ): Promise<PaginationResult<T>> {
    const page = Math.max(1, params.page || 1)
    const limit = Math.max(1, Math.min(100, params.limit || 20))
    const skip = (page - 1) * limit

    const typedQuery = query as { skip: (n: number) => { take: (n: number) => Promise<T[]> } };
    const [data] = await Promise.all([
      typedQuery.skip(skip).take(limit),
    ])
    const total = 0

    const totalPages = Math.ceil((total as number) / limit)

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    }
  }
formatPhoneNumber(phone: string, country: string = 'US'): string {
    const cleaned = phone.replace(/\D/g, '')

    if (country === 'US' && cleaned.length === 10) {
      return `+1${cleaned}`
    }

    return phone.startsWith('+') ? phone : `+${cleaned}`
  }
isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\d\s\-+()]{10,}$/
    return phoneRegex.test(phone)
  }
formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }
calculateAge(dob: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }

    return age
  }
getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
isDateInPast(date: Date): boolean {
    return new Date(date) < new Date()
  }
isDateInFuture(date: Date): boolean {
    return new Date(date) > new Date()
  }
formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
generateId(prefix?: string): string {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    return prefix ? `${prefix}-${id}` : id
  }
truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
toSlug(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(processor))
      results.push(...batchResults)
    }

    return results
  }
async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await this.delay(delay * (i + 1))
      }
    }
    throw new Error('Max retries exceeded')
  }
}

export default new UtilityService()

