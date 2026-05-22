import { ORDER_STATUS, PAYMENT_STATUS, ESIM_STATUS, TICKET_STATUS } from '../constants'
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader,
  Pause,
  ZapOff,
} from 'lucide-react'
import React from 'react'

type StatusType = 'order' | 'payment' | 'esim' | 'ticket'
export const getStatusColor = (status: string, type: StatusType = 'order'): string => {
  const s = status?.toUpperCase() || ''

  switch (type) {
    case 'order':
      if (s === ORDER_STATUS.COMPLETED) return 'bg-green-100 text-green-800'
      if (s === ORDER_STATUS.PROCESSING) return 'bg-blue-100 text-blue-800'
      if (s === ORDER_STATUS.PENDING) return 'bg-amber-100 text-amber-800'
      if (s === ORDER_STATUS.CANCELLED) return 'bg-red-100 text-red-800'
      if (s === ORDER_STATUS.REFUNDED) return 'bg-purple-100 text-purple-800'
      break

    case 'payment':
      if (s === PAYMENT_STATUS.COMPLETED) return 'bg-green-100 text-green-800'
      if (s === PAYMENT_STATUS.PENDING) return 'bg-yellow-100 text-yellow-800'
      if (s === PAYMENT_STATUS.FAILED) return 'bg-red-100 text-red-800'
      if (s === PAYMENT_STATUS.REFUNDED) return 'bg-purple-100 text-purple-800'
      break

    case 'esim':
      if (s === ESIM_STATUS.ACTIVATED) return 'bg-green-100 text-green-800'
      if (s === ESIM_STATUS.ASSIGNED) return 'bg-blue-100 text-blue-800'
      if (s === ESIM_STATUS.SUSPENDED) return 'bg-orange-100 text-orange-800'
      if (s === ESIM_STATUS.EXPIRED) return 'bg-gray-100 text-gray-800'
      if (s === ESIM_STATUS.DEACTIVATED) return 'bg-red-100 text-red-800'
      if (s === ESIM_STATUS.AVAILABLE) return 'bg-primary-100 text-primary-800'
      break

    case 'ticket':
      if (s === TICKET_STATUS.RESOLVED) return 'bg-green-100 text-green-800'
      if (s === TICKET_STATUS.IN_PROGRESS) return 'bg-blue-100 text-blue-800'
      if (s === TICKET_STATUS.OPEN) return 'bg-yellow-100 text-yellow-800'
      if (s === TICKET_STATUS.CLOSED) return 'bg-gray-100 text-gray-800'
      break
  }

  return 'bg-gray-100 text-gray-800'
}
export const getStatusIcon = (status: string, type: StatusType = 'order'): React.ReactNode => {
  const s = status?.toUpperCase() || ''

  switch (type) {
    case 'order':
      if (s === ORDER_STATUS.COMPLETED) return React.createElement(CheckCircle, { className: 'w-4 h-4' })
      if (s === ORDER_STATUS.PROCESSING) return React.createElement(Loader, { className: 'w-4 h-4 animate-spin' })
      if (s === ORDER_STATUS.PENDING) return React.createElement(Clock, { className: 'w-4 h-4' })
      if (s === ORDER_STATUS.CANCELLED) return React.createElement(XCircle, { className: 'w-4 h-4' })
      if (s === ORDER_STATUS.REFUNDED) return React.createElement(AlertCircle, { className: 'w-4 h-4' })
      break

    case 'payment':
      if (s === PAYMENT_STATUS.COMPLETED) return React.createElement(CheckCircle, { className: 'w-4 h-4' })
      if (s === PAYMENT_STATUS.PENDING) return React.createElement(Clock, { className: 'w-4 h-4' })
      if (s === PAYMENT_STATUS.FAILED) return React.createElement(XCircle, { className: 'w-4 h-4' })
      if (s === PAYMENT_STATUS.REFUNDED) return React.createElement(AlertCircle, { className: 'w-4 h-4' })
      break

    case 'esim':
      if (s === ESIM_STATUS.ACTIVATED) return React.createElement(CheckCircle, { className: 'w-4 h-4' })
      if (s === ESIM_STATUS.ASSIGNED) return React.createElement(Loader, { className: 'w-4 h-4 animate-spin' })
      if (s === ESIM_STATUS.SUSPENDED) return React.createElement(Pause, { className: 'w-4 h-4' })
      if (s === ESIM_STATUS.DEACTIVATED) return React.createElement(ZapOff, { className: 'w-4 h-4' })
      break

    case 'ticket':
      if (s === TICKET_STATUS.RESOLVED) return React.createElement(CheckCircle, { className: 'w-4 h-4' })
      if (s === TICKET_STATUS.IN_PROGRESS) return React.createElement(Clock, { className: 'w-4 h-4' })
      if (s === TICKET_STATUS.OPEN) return React.createElement(AlertCircle, { className: 'w-4 h-4' })
      if (s === TICKET_STATUS.CLOSED) return React.createElement(XCircle, { className: 'w-4 h-4' })
      break
  }

  return null
}
export const getStatusLabel = (status: string): string => {
  const s = status?.toUpperCase() || ''
  return s
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}
export const isStatusComplete = (status: string, type: StatusType = 'order'): boolean => {
  const s = status?.toUpperCase() || ''

  if (type === 'order') {
    return s === ORDER_STATUS.COMPLETED || s === ORDER_STATUS.REFUNDED
  }
  if (type === 'payment') {
    return s === PAYMENT_STATUS.COMPLETED || s === PAYMENT_STATUS.REFUNDED
  }
  if (type === 'esim') {
    return s === ESIM_STATUS.ACTIVATED || s === ESIM_STATUS.DEACTIVATED
  }
  if (type === 'ticket') {
    return s === TICKET_STATUS.RESOLVED || s === TICKET_STATUS.CLOSED
  }

  return false
}
export const isStatusError = (status: string, type: StatusType = 'order'): boolean => {
  const s = status?.toUpperCase() || ''

  if (type === 'order') {
    return s === ORDER_STATUS.CANCELLED
  }
  if (type === 'payment') {
    return s === PAYMENT_STATUS.FAILED
  }
  if (type === 'esim') {
    return s === ESIM_STATUS.DEACTIVATED || s === ESIM_STATUS.EXPIRED
  }

  return false
}
export const isStatusPending = (status: string, type: StatusType = 'order'): boolean => {
  const s = status?.toUpperCase() || ''

  if (type === 'order') {
    return s === ORDER_STATUS.PENDING || s === ORDER_STATUS.PROCESSING
  }
  if (type === 'payment') {
    return s === PAYMENT_STATUS.PENDING
  }
  if (type === 'esim') {
    return s === ESIM_STATUS.ASSIGNED || s === ESIM_STATUS.AVAILABLE
  }
  if (type === 'ticket') {
    return s === TICKET_STATUS.OPEN || s === TICKET_STATUS.IN_PROGRESS
  }

  return false
}

export default {
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
  isStatusComplete,
  isStatusError,
  isStatusPending,
}
