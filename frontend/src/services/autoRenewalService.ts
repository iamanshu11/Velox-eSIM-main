import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface AutoRenewal {
  id: string;
  userId: string;
  esimId: string;
  enabled: boolean;
  renewalDaysBefore: number;
  autoPayFromWallet: boolean;
  maxAutoRenewals: number;
  renewalCount: number;
  lastRenewalAt?: string;
  nextScheduledRenewal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutoRenewalInput {
  esimId: string;
  renewalDaysBefore?: number;
  autoPayFromWallet?: boolean;
  maxAutoRenewals?: number;
}

export interface UpdateAutoRenewalInput {
  renewalDaysBefore?: number;
  autoPayFromWallet?: boolean;
  maxAutoRenewals?: number;
}

export const autoRenewalService = {
  async create(data: CreateAutoRenewalInput): Promise<AutoRenewal> {
    const response = await apiClient.post<ApiResponse<AutoRenewal>>('/orders/auto-renewal/create', data);
    return response.data!;
  },

  async list(page: number = 1, limit: number = 10): Promise<PaginatedResponse<AutoRenewal>> {
    const response = await apiClient.get<PaginatedResponse<AutoRenewal>>(
      `/orders/auto-renewal/list?page=${page}&limit=${limit}`
    );
    return response;
  },

  async getById(id: string): Promise<AutoRenewal> {
    const response = await apiClient.get<ApiResponse<AutoRenewal>>(`/orders/auto-renewal/${id}`);
    return response.data!;
  },

  async update(id: string, data: UpdateAutoRenewalInput): Promise<AutoRenewal> {
    const response = await apiClient.patch<ApiResponse<AutoRenewal>>(
      `/orders/auto-renewal/${id}/update`,
      data
    );
    return response.data!;
  },

  async enable(id: string): Promise<AutoRenewal> {
    const response = await apiClient.post<ApiResponse<AutoRenewal>>(
      `/orders/auto-renewal/${id}/enable`,
      {}
    );
    return response.data!;
  },

  async disable(id: string): Promise<AutoRenewal> {
    const response = await apiClient.post<ApiResponse<AutoRenewal>>(
      `/orders/auto-renewal/${id}/disable`,
      {}
    );
    return response.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/orders/auto-renewal/${id}`);
  },

  async getUpcoming(page: number = 1, limit: number = 10): Promise<PaginatedResponse<AutoRenewal>> {
    const response = await apiClient.get<PaginatedResponse<AutoRenewal>>(
      `/orders/auto-renewal/upcoming?page=${page}&limit=${limit}`
    );
    return response;
  },
};

export default autoRenewalService;
