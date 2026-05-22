import { apiSlice } from './apiSlice';
import type { BillingStatement, BillingStats } from '@/services/billingService';
import type { PaginatedResponse } from '@/types';

export const billingSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentStatement: builder.query<BillingStatement, { month?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && 'month' in params && params.month) {
          searchParams.append('month', params.month);
        }
        return `/payments/billing/statement${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Billing'],
    }),

    getBillingStatements: builder.query<
      PaginatedResponse<BillingStatement>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/payments/billing/statements?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Billing'],
    }),

    getBillingStats: builder.query<BillingStats, void>({
      query: () => '/payments/billing/stats',
      transformResponse: (response: any) => response.data,
      providesTags: ['Billing'],
    }),
  }),
});

export const {
  useGetCurrentStatementQuery,
  useGetBillingStatementsQuery,
  useGetBillingStatsQuery,
} = billingSlice;

export default billingSlice;
