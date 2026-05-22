'use client'

import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/apiClient'
import { BackendApiResponse, BackendPaginatedResponse } from '@/types/api'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: string
  readAt?: string
}

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  refetch: () => Promise<void>
}

export const useNotifications = (limit: number = 20, unreadOnly: boolean = false): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: String(limit),
        unreadOnly: String(unreadOnly),
      })
      const response = await apiClient.get<BackendPaginatedResponse<Notification>>(`/notifications?${params}`)

      setNotifications(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [limit, unreadOnly])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.get<BackendApiResponse<{ count: number }>>('/notifications/unread/count')
      setUnreadCount(response.data?.count || 0)
    } catch (err: any) {
      console.error('Failed to fetch unread count:', err)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.patch<BackendApiResponse<void>>(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      await fetchUnreadCount()
    } catch (err: any) {
      setError(err.message || 'Failed to mark as read')
    }
  }, [fetchUnreadCount])

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.patch<BackendApiResponse<void>>('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err: any) {
      setError(err.message || 'Failed to mark all as read')
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiClient.delete<BackendApiResponse<void>>(`/notifications/${id}`)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      await fetchUnreadCount()
    } catch (err: any) {
      setError(err.message || 'Failed to delete notification')
    }
  }, [fetchUnreadCount])

  const deleteAllNotifications = useCallback(async () => {
    try {
      await apiClient.delete<BackendApiResponse<void>>('/notifications')
      setNotifications([])
      setUnreadCount(0)
    } catch (err: any) {
      setError(err.message || 'Failed to delete all notifications')
    }
  }, [])

  const refetch = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch,
  }
}
