import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import type {
  ApiResponse,
  AnalyticsMetrics,
  RevenueAnalytics,
  UserGrowth,
  PlanPopularity,
  OrderStats,
  PaymentStats,
} from '@/types';

export const analyticsService = {
  getDashboardMetrics: async (): Promise<AnalyticsMetrics> => {
    try {
      const response = await apiClient.get<ApiResponse<AnalyticsMetrics>>(
        '/analytics/metrics'
      );
      return (response.data as any)?.data ?? {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        growth: 0,
      };
    } catch (error) {
      logger.error('[AnalyticsService] getDashboardMetrics error', error);
      throw error;
    }
  },

  getRevenueAnalytics: async (period?: string): Promise<RevenueAnalytics> => {
    try {
      const url = period ? `/analytics/revenue?period=${period}` : '/analytics/revenue';
      const response = await apiClient.get<ApiResponse<RevenueAnalytics>>(url);
      return (response.data as any)?.data ?? {
        period: 'monthly',
        revenue: 0,
        orders: 0,
        averageOrderValue: 0,
        data: [],
      };
    } catch (error) {
      logger.error('[AnalyticsService] getRevenueAnalytics error', error);
      throw error;
    }
  },

  getUserGrowth: async (period?: string): Promise<UserGrowth> => {
    try {
      const url = period ? `/analytics/growth?period=${period}` : '/analytics/growth';
      const response = await apiClient.get<ApiResponse<UserGrowth>>(url);
      return (response.data as any)?.data ?? {
        period: 'monthly',
        newUsers: 0,
        totalUsers: 0,
        data: [],
      };
    } catch (error) {
      logger.error('[AnalyticsService] getUserGrowth error', error);
      throw error;
    }
  },

  getPlanPopularity: async (): Promise<PlanPopularity[]> => {
    try {
      const response = await apiClient.get<ApiResponse<PlanPopularity[]>>(
        '/analytics/popularity'
      );
      return (response.data as any)?.data ?? [];
    } catch (error) {
      logger.error('[AnalyticsService] getPlanPopularity error', error);
      throw error;
    }
  },

  getOrderStats: async (): Promise<OrderStats> => {
    try {
      const response = await apiClient.get<ApiResponse<OrderStats>>(
        '/analytics/orders'
      );
      return (response.data as any)?.data ?? {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        failedOrders: 0,
        averageOrderValue: 0,
        topCountries: [],
      };
    } catch (error) {
      logger.error('[AnalyticsService] getOrderStats error', error);
      throw error;
    }
  },

  getPaymentStats: async (): Promise<PaymentStats> => {
    try {
      const response = await apiClient.get<ApiResponse<PaymentStats>>(
        '/analytics/payments'
      );
      return (response.data as any)?.data ?? {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        totalAmount: 0,
        paymentMethods: [],
      };
    } catch (error) {
      logger.error('[AnalyticsService] getPaymentStats error', error);
      throw error;
    }
  },
};

export default analyticsService;
