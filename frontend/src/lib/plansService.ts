import { apiClient } from './apiClient';
import { BackendApiResponse } from '@/types/api';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  dataLimit: string;
  validity: string;
  price: number;
  originalPrice?: number;
  country: string;
  operatorName: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlansResponse {
  success: boolean;
  data: Plan[];
  total?: number;
  page?: number;
  limit?: number;
}

export const plansService = {
  async getAllPlans(filters?: {
    country?: string;
    operatorName?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Plan[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.country) params.append('country', filters.country);
      if (filters?.operatorName) params.append('operatorName', filters.operatorName);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await apiClient.get<BackendApiResponse<{ data: Plan[] }>>(`/plans?${params.toString()}`);
      return response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  async searchPlans(query: string): Promise<Plan[]> {
    try {
      const response = await apiClient.get<BackendApiResponse<{ data: Plan[] }>>(`/plans/search?q=${encodeURIComponent(query)}`);
      return response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const response = await apiClient.get<BackendApiResponse<{ data: Plan }>>(`/plans/${planId}`);
      return response.data?.data || null;
    } catch (error) {
      return null;
    }
  },

  async getCountries(): Promise<string[]> {
    try {
      const response = await apiClient.get<BackendApiResponse<{ data: string[] }>>('/plans/countries');
      return response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  async getOperators(): Promise<string[]> {
    try {
      const response = await apiClient.get<BackendApiResponse<{ data: string[] }>>('/plans/operators');
      return response.data?.data || [];
    } catch (error) {
      return [];
    }
  },
};
