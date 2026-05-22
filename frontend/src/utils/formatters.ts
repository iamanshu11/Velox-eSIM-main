export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const formatDate = (date: string | Date | undefined, format: 'short' | 'long' = 'short'): string => {
  if (!date) return 'N/A'
  const d = new Date(date)
  const options: Intl.DateTimeFormatOptions = format === 'short'
    ? { year: '2-digit', month: '2-digit', day: '2-digit' }
    : { year: 'numeric', month: 'long', day: 'numeric' }
  return d.toLocaleDateString('en-US', options)
}

export const formatBytes = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export const generateOrderId = (): string => {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const FORMATTERS = {
  formatCurrency,
  formatDate,
  formatBytes,
  truncateString,
  capitalizeFirstLetter,
  getInitials,
  isEmail,
  isPhone,
  generateOrderId,
  delay,
}

export default FORMATTERS
