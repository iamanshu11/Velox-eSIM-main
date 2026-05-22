'use client'

import React, { forwardRef, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  fullWidth?: boolean
  ariaDescribedBy?: string
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, icon, fullWidth = true, className = '', id, ariaDescribedBy, ...props }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${fieldId}-error`
    const helperId = `${fieldId}-helper`
    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
      ariaDescribedBy
    ].filter(Boolean).join(' ')

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-semibold text-gray-900 mb-2.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={`w-full rounded-lg border ${
              error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-600'
            } bg-white px-4 py-2.5 ${icon ? 'pl-10' : ''} text-gray-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />
        </div>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1"
          >
            <span className="text-red-500">●</span>
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-xs text-slate-600">{helperText}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const fieldId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${fieldId}-error`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-semibold text-gray-900 mb-2.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={`w-full rounded-lg border ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-600'
          } bg-white px-4 py-2.5 text-gray-900 transition-colors focus:outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-500 ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1"
          >
            <span className="text-red-500">●</span>
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

SelectField.displayName = 'SelectField'

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            ref={ref}
            type="checkbox"
            className={`w-5 h-5 rounded border-slate-300 text-primary-700 focus:ring-2 focus:ring-primary-500/50 transition-colors dark:border-gray-700 dark:bg-gray-800 ${className}`}
            {...props}
          />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-300 transition-colors">{label}</span>
        </label>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1"
          >
            <span className="text-red-500">●</span>
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

CheckboxField.displayName = 'CheckboxField'

interface RadioFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const RadioField = forwardRef<HTMLInputElement, RadioFieldProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          ref={ref}
          type="radio"
          className={`w-4 h-4 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-800 ${className}`}
          {...props}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </label>
    )
  }
)

RadioField.displayName = 'RadioField'

export { FormField, SelectField, CheckboxField, RadioField }

