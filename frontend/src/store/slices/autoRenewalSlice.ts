import { apiSlice } from './apiSlice';
import type { AutoRenewal, CreateAutoRenewalInput, UpdateAutoRenewalInput } from '@/services/autoRenewalService';
import type { PaginatedResponse } from '@/types';

export const autoRenewalSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAutoRenewals: builder.query<
      PaginatedResponse<AutoRenewal>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/orders/auto-renewal/list?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['AutoRenewal'],
    }),

    getAutoRenewal: builder.query<AutoRenewal, string>({
      query: (id) => `/orders/auto-renewal/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['AutoRenewal'],
    }),

    getUpcomingAutoRenewals: builder.query<
      PaginatedResponse<AutoRenewal>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/orders/auto-renewal/upcoming?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['AutoRenewal'],
    }),

    createAutoRenewal: builder.mutation<AutoRenewal, CreateAutoRenewalInput>({
      query: (data) => ({
        url: '/orders/auto-renewal/create',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['AutoRenewal'],
    }),

    updateAutoRenewal: builder.mutation<
      AutoRenewal,
      { id: string; data: UpdateAutoRenewalInput }
    >({
      query: ({ id, data }) => ({
        url: `/orders/auto-renewal/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['AutoRenewal'],
    }),

    enableAutoRenewal: builder.mutation<AutoRenewal, string>({
      query: (id) => ({
        url: `/orders/auto-renewal/${id}/enable`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['AutoRenewal'],
    }),

    disableAutoRenewal: builder.mutation<AutoRenewal, string>({
      query: (id) => ({
        url: `/orders/auto-renewal/${id}/disable`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['AutoRenewal'],
    }),

    deleteAutoRenewal: builder.mutation<void, string>({
      query: (id) => ({
        url: `/orders/auto-renewal/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AutoRenewal'],
    }),
  }),
});

export const {
  useGetAutoRenewalsQuery,
  useGetAutoRenewalQuery,
  useGetUpcomingAutoRenewalsQuery,
  useCreateAutoRenewalMutation,
  useUpdateAutoRenewalMutation,
  useEnableAutoRenewalMutation,
  useDisableAutoRenewalMutation,
  useDeleteAutoRenewalMutation,
} = autoRenewalSlice;

export default autoRenewalSlice;
