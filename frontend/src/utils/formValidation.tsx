import { FC } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message?: string | string[]
  className?: string
}
export const FormError: FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null

  const messages = Array.isArray(message) ? message : [message]

  return (
    <div className={`space-y-2 ${className}`}>
      {messages.map((msg, idx) => (
        <div key={idx} className="flex gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{msg}</span>
        </div>
      ))}
    </div>
  )
}
export const getFieldError = (
  fieldName: string,
  errors?: Record<string, string | string[]>
): string[] | undefined => {
  if (!errors || !errors[fieldName]) return undefined
  const err = errors[fieldName]
  return Array.isArray(err) ? err : [err]
}
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string | string[]>
}
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ((value: any) => string | null)[]>
): ValidationResult => {
  const errors: Record<string, string[]> = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    const fieldErrors: string[] = []

    for (const rule of fieldRules) {
      const error = rule(data[field])
      if (error) {
        fieldErrors.push(error)
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export default {
  FormError,
  getFieldError,
  validateForm,
}
