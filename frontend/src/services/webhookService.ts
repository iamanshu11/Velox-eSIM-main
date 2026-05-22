import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import type { ApiResponse, WebhookEvent } from '@/types';

export const webhookService = {
  getWebhookHistory: async (
    page: number = 1,
    limit: number = 10
  ): Promise<{ webhooks: WebhookEvent[]; total: number }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{ webhooks: WebhookEvent[]; total: number }>
      >(`/webhooks/history?page=${page}&limit=${limit}`);
      return (response.data as any)?.data ?? { webhooks: [], total: 0 };
    } catch (error) {
      logger.error('[WebhookService] getWebhookHistory error', error);
      throw error;
    }
  },

  getPendingWebhooks: async (): Promise<WebhookEvent[]> => {
    try {
      const response = await apiClient.get<ApiResponse<WebhookEvent[]>>(
        '/webhooks/pending'
      );
      return (response.data as any)?.data ?? [];
    } catch (error) {
      logger.error('[WebhookService] getPendingWebhooks error', error);
      throw error;
    }
  },

  retryFailedWebhooks: async (): Promise<{ retriedCount: number }> => {
    try {
      const response = await apiClient.post<
        ApiResponse<{ retriedCount: number }>
      >('/webhooks/retry', {});
      logger.debug('[WebhookService] Failed webhooks retried successfully');
      return (response.data as any)?.data ?? { retriedCount: 0 };
    } catch (error) {
      logger.error('[WebhookService] retryFailedWebhooks error', error);
      throw error;
    }
  },

  webhookHealthCheck: async (): Promise<{ status: string }> => {
    try {
      const response = await apiClient.get<ApiResponse<{ status: string }>>(
        '/webhooks/health'
      );
      return (response.data as any)?.data ?? { status: 'unknown' };
    } catch (error) {
      logger.error('[WebhookService] webhookHealthCheck error', error);
      throw error;
    }
  },
};

export default webhookService;
