import { apiClient } from "@lib/apiClient";
import type { ApiResponse } from "@/types";

export interface ESIM {
  id: string;
  iccid: string;
  msisdn?: string;
  status: string;
  planId: string;
  userId?: string;
  activatedAt?: string;
  expiresAt?: string;
  plan?: any;
}

export const esimService = {
  async createESIM(data: { iccid: string; planId: string }): Promise<ESIM> {
    const response = await apiClient.post<ApiResponse<ESIM>>("/esims", data);
    return response.data!;
  },

  async getESIMById(id: string): Promise<ESIM> {
    const response = await apiClient.get<ApiResponse<ESIM>>(`/esims/${id}`);
    return response.data!;
  },

  async getAllESIMs(): Promise<ESIM[]> {
    const response =
      await apiClient.get<ApiResponse<any>>("/esims/my-esims?page=1&limit=100");
    return response.data?.data || [];
  },

  async activateESIM(id: string): Promise<ESIM> {
    const response = await apiClient.post<ApiResponse<ESIM>>(
      `/esims/${id}/activate`,
      {},
    );
    return response.data!;
  },

  async deactivateESIM(id: string): Promise<ESIM> {
    const response = await apiClient.post<ApiResponse<ESIM>>(
      `/esims/${id}/deactivate`,
      {},
    );
    return response.data!;
  },

  async assignESIM(id: string, orderId: string): Promise<ESIM> {
    const response = await apiClient.post<ApiResponse<ESIM>>(
      `/esims/${id}/assign`,
      {
        orderId,
      },
    );
    return response.data!;
  },

  async updateDataUsage(id: string, dataUsed: number): Promise<ESIM> {
    const response = await apiClient.put<ApiResponse<ESIM>>(
      `/esims/${id}/data-usage`,
      {
        dataUsed,
      },
    );
    return response.data!;
  },
};

export default esimService;
