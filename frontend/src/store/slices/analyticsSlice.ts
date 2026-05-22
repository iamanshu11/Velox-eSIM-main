import { apiSlice } from './apiSlice';
import type {
  AnalyticsMetrics,
  RevenueAnalytics,
  UserGrowth,
  PlanPopularity,
  OrderStats,
  PaymentStats,
} from '@/types';
import type { BackendApiResponse } from '@/types/api';

export const analyticsSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query<AnalyticsMetrics, void>({
      query: () => '/analytics/metrics',
      transformResponse: (response: BackendApiResponse<AnalyticsMetrics>) => {
        const data = (response.data ?? {}) as Record<string, unknown>;
        const growthSource = data.growth ?? data.conversionRate;

        return {
          totalRevenue: Number(data.totalRevenue ?? 0),
          totalOrders: Number(data.totalOrders ?? 0),
          totalCustomers: Number(data.totalCustomers ?? data.totalUsers ?? 0),
          growth: Number(growthSource ?? 0),
          activeEsims: Number(data.activeEsims ?? data.activeESIMs ?? 0),
          expiredEsims: Number(data.expiredEsims ?? data.expiredESIMs ?? 0),
        } as AnalyticsMetrics;
      },
      providesTags: ['Analytics'],
      keepUnusedDataFor: 600,
    }),

    getRevenueAnalytics: builder.query<RevenueAnalytics, string | undefined>({
      query: (period) =>
        period ? `/analytics/revenue?period=${period}` : '/analytics/revenue',
      transformResponse: (response: BackendApiResponse<RevenueAnalytics>) => 
        response.data ?? ({} as RevenueAnalytics),
      providesTags: ['Analytics'],
    }),

    getUserGrowth: builder.query<UserGrowth, string | undefined>({
      query: (period) =>
        period ? `/analytics/growth?period=${period}` : '/analytics/growth',
      transformResponse: (response: BackendApiResponse<UserGrowth>) => 
        response.data ?? ({} as UserGrowth),
      providesTags: ['Analytics'],
    }),

    getPlanPopularity: builder.query<PlanPopularity[], void>({
      query: () => '/analytics/popularity',
      transformResponse: (response: BackendApiResponse<PlanPopularity[]>) => 
        response.data ?? [],
      providesTags: ['Analytics'],
    }),

    getPurchaseOverview: builder.query<any[], void>({
      query: () => '/analytics/overview/purchase?days=30',
      transformResponse: (response: BackendApiResponse<any[]>) => response.data ?? [],
      providesTags: ['Analytics'],
      keepUnusedDataFor: 600,
    }),

    getActiveESIMOverview: builder.query<any[], void>({
      query: () => '/analytics/overview/esim',
      transformResponse: (response: BackendApiResponse<any[]>) => response.data ?? [],
      providesTags: ['Analytics'],
      keepUnusedDataFor: 600,
    }),

    getTopPackages: builder.query<any[], void>({
      query: () => '/analytics/overview/packages?limit=12',
      transformResponse: (response: BackendApiResponse<any[]>) => response.data ?? [],
      providesTags: ['Analytics'],
      keepUnusedDataFor: 600,
    }),

    getRecentPurchases: builder.query<any[], void>({
      query: () => '/analytics/overview/recent-purchases?limit=6',
      transformResponse: (response: BackendApiResponse<any[]>) => response.data ?? [],
      providesTags: ['Analytics'],
      keepUnusedDataFor: 600,
    }),

    getOrderStats: builder.query<OrderStats, void>({
      query: () => '/analytics/orders',
      transformResponse: (response: BackendApiResponse<OrderStats>) => 
        response.data ?? ({} as OrderStats),
      providesTags: ['Analytics'],
    }),

    getPaymentStats: builder.query<PaymentStats, void>({
      query: () => '/analytics/payments',
      transformResponse: (response: BackendApiResponse<PaymentStats>) => 
        response.data ?? ({} as PaymentStats),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetRevenueAnalyticsQuery,
  useGetUserGrowthQuery,
  useGetPlanPopularityQuery,
  useGetPurchaseOverviewQuery,
  useGetActiveESIMOverviewQuery,
  useGetTopPackagesQuery,
  useGetRecentPurchasesQuery,
  useGetOrderStatsQuery,
  useGetPaymentStatsQuery,
} = analyticsSlice;
