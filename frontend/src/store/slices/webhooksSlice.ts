import { apiSlice } from './apiSlice';
import type { WebhookEvent } from '@/types';

export const webhooksSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWebhookHistory: builder.query<
      { webhooks: WebhookEvent[]; total: number },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/webhooks/history?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Webhooks'],
    }),

    getPendingWebhooks: builder.query<WebhookEvent[], void>({
      query: () => '/webhooks/pending',
      transformResponse: (response: any) => response.data ?? [],
      providesTags: ['Webhooks'],
    }),

    retryFailedWebhooks: builder.mutation<{ retriedCount: number }, void>({
      query: () => ({
        url: '/webhooks/retry',
        method: 'POST',
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Webhooks'],
    }),

    webhookHealthCheck: builder.query<{ status: string }, void>({
      query: () => '/webhooks/health',
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useGetWebhookHistoryQuery,
  useGetPendingWebhooksQuery,
  useRetryFailedWebhooksMutation,
  useWebhookHealthCheckQuery,
} = webhooksSlice;
