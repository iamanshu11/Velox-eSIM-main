import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface ReferralCode {
  id: string;
  code: string;
  userId: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralUsage {
  id: string;
  referralCodeId: string;
  referredUserId: string;
  referredUserEmail: string;
  discountApplied: number;
  usedAt: string;
  status: 'pending' | 'active' | 'inactive';
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  currentCode?: ReferralCode;
}

export interface CreateReferralCodeInput {
  discount: number;
  maxUses?: number;
  expiresAt?: string;
}

export const referralService = {
  async getMyCodes(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ReferralCode>> {
    const response = await apiClient.get<PaginatedResponse<ReferralCode>>(
      `/wallet/referral/my-codes?page=${page}&limit=${limit}`
    );
    return response;
  },

  async createCode(data: CreateReferralCodeInput): Promise<ReferralCode> {
    const response = await apiClient.post<ApiResponse<ReferralCode>>(
      '/wallet/referral/generate',
      data
    );
    return response.data!;
  },

  async getCodeByCode(code: string): Promise<ReferralCode> {
    const response = await apiClient.get<ApiResponse<ReferralCode>>(
      `/wallet/referral/validate/${code}`
    );
    return response.data!;
  },

  async useCode(code: string): Promise<ReferralUsage> {
    const validateResponse = await apiClient.get<ApiResponse<ReferralCode>>(
      `/wallet/referral/validate/${code}`
    );
    const referralCodeId = validateResponse.data?.id;
    if (!referralCodeId) throw new Error('Invalid referral code');
    const response = await apiClient.post<ApiResponse<ReferralUsage>>(
      '/wallet/referral/redeem',
      { referralCodeId }
    );
    return response.data!;
  },

  async getCodeUsages(_codeId: string, _page: number = 1, _limit: number = 10): Promise<PaginatedResponse<ReferralUsage>> {
    return { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } } as unknown as PaginatedResponse<ReferralUsage>;
  },

  async deactivateCode(codeId: string): Promise<ReferralCode> {
    const response = await apiClient.patch<ApiResponse<ReferralCode>>(
      `/wallet/referral/${codeId}/deactivate`,
      {}
    );
    return response.data!;
  },

  async reactivateCode(codeId: string): Promise<ReferralCode> {
    const response = await apiClient.patch<ApiResponse<ReferralCode>>(
      `/wallet/referral/${codeId}/activate`,
      {}
    );
    return response.data!;
  },

  async getStats(): Promise<ReferralStats> {
    const response = await apiClient.get<ApiResponse<ReferralStats>>(
      '/wallet/referral/stats'
    );
    return response.data!;
  },
};

export default referralService;
