export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

export const validateFieldRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}

export const validateFieldMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength
}

export const validateFieldMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength
}

export const validateFieldPattern = (value: string, pattern: RegExp): boolean => {
  return pattern.test(value)
}

const VALIDATORS = {
  ValidationError,
  validateEmail,
  validatePassword,
  validatePhone,
  validateUrl,
  validateFieldRequired,
  validateFieldMinLength,
  validateFieldMaxLength,
  validateFieldPattern,
}

export default VALIDATORS
