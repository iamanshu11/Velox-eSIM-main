export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

export const PAGINATION_LIMIT = 20

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  RESELLER: 'RESELLER',
  CUSTOMER: 'CUSTOMER',
} as const

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const

export const ESIM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  ACTIVATED: 'ACTIVATED',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  DEACTIVATED: 'DEACTIVATED',
} as const

export const TICKET_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const

export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const

export const PLAN_VALIDITY = {
  ONE_WEEK: '7',
  TWO_WEEKS: '14',
  ONE_MONTH: '30',
  THREE_MONTHS: '90',
  SIX_MONTHS: '180',
  ONE_YEAR: '365',
} as const

export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
] as const

export const NOTIFICATION_TYPES = {
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  ESIM_ACTIVATED: 'ESIM_ACTIVATED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  TICKET_UPDATED: 'TICKET_UPDATED',
  PROMOTION: 'PROMOTION',
} as const

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const

export const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export const PROTECTED_ROUTES = ['/dashboard']

export const ADMIN_ROUTES = ['/admin']

const CONFIG = {
  API_BASE_URL,
  STRIPE_PUBLISHABLE_KEY,
  PAGINATION_LIMIT,
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ESIM_STATUS,
  TICKET_STATUS,
  TICKET_PRIORITY,
  PLAN_VALIDITY,
  COUNTRIES,
  NOTIFICATION_TYPES,
  THEME,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  ADMIN_ROUTES,
}

export default CONFIG
