'use client'

import { useState, useCallback, useEffect } from 'react'
import apiClient from '@/lib/apiClient'
import { BackendApiResponse } from '@/types/api'

interface AnalyticsData {
  [key: string]: any
}

interface UseAnalyticsResult {
  data: AnalyticsData
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useDashboardAnalytics = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<BackendApiResponse<any>>('/analytics/dashboard/overview')
      setData(response.data || {})
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export const useUserAnalytics = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<BackendApiResponse<any>>('/analytics/user/overview')
      setData(response.data || {})
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export const useRevenueAnalytics = (from?: string, to?: string): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to

      const response = await apiClient.get<BackendApiResponse<any>>('/analytics/revenue', params)
      setData(response.data || {})
    } catch (err: any) {
      setError(err.message || 'Failed to fetch revenue analytics')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export const useUserGrowthAnalytics = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<BackendApiResponse<any>>('/analytics/users/growth')
      setData(response.data || {})
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user growth analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export const usePlanPopularityAnalytics = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<BackendApiResponse<any>>('/analytics/plans/popularity')
      setData(response.data || {})
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plan popularity analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export const useESIMAnalytics = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<BackendApiResponse<any>>('/analytics/esims/stats')
      setData(response.data || {})
    } catch (err: any) {
      setError(err.message || 'Failed to fetch eSIM analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export const useSupportAnalytics = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<BackendApiResponse<any>>('/analytics/support/stats')
      setData(response.data || {})
    } catch (err: any) {
      setError(err.message || 'Failed to fetch support analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
