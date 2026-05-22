import { apiSlice } from './apiSlice';
import type { Order } from '@/types';

export const ordersSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<
      Order,
      {
        items: { planId: string; quantity: number }[];
        shippingAddress?: string;
        billingAddress?: string;
      }
    >({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Orders'],
    }),

    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Orders'],
    }),

    getUserOrders: builder.query<
      { orders: Order[]; pagination: any },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/orders/user/my-orders?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => {
        const data = response?.data || response;
        return {
          orders: Array.isArray(data) ? data : (data?.orders ?? []),
          pagination: data?.pagination || response?.pagination,
        };
      },
      providesTags: ['Orders'],
    }),

    getAllOrders: builder.query<
      { orders: Order[]; pagination: any },
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 10, status }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) params.append('status', status);
        return `/orders?${params.toString()}`;
      },
      transformResponse: (response: any) => ({
        orders: response.data ?? [],
        pagination: response.pagination,
      }),
      providesTags: ['Orders'],
    }),

    updateOrderStatus: builder.mutation<Order, { id: string; status: string }>(
      {
        query: ({ id, status }) => ({
          url: `/orders/${id}/status`,
          method: 'PATCH',
          body: { status },
        }),
        transformResponse: (response: any) => response.data,
        invalidatesTags: ['Orders'],
      }
    ),

    cancelOrder: builder.mutation<Order, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Orders'],
    }),

    getActiveESIMs: builder.query<any[], void>({
      query: () => '/orders/dashboard/active-esims?limit=5',
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: ['Orders'],
    }),

    getExpiringESIMs: builder.query<any[], void>({
      query: () => '/orders/dashboard/expiring-esims?days=30',
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data : [],
      providesTags: ['Orders'],
    }),

    getDashboardAnalytics: builder.query<any, void>({
      query: () => '/orders/dashboard/analytics',
      transformResponse: (response: any) =>
        response?.data && typeof response.data === 'object' ? response.data : null,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useGetUserOrdersQuery,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useGetActiveESIMsQuery,
  useGetExpiringESIMsQuery,
  useGetDashboardAnalyticsQuery,
} = ordersSlice;
