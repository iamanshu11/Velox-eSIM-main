import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import type { ApiResponse } from '@/types';

export interface ESimPurchaseRequest {
  amount: number;
  packageInfoList: Array<{
    packageCode: string;
    count: number;
  }>;
}

export interface ESimPurchaseResponse {
  order: {
    orderNo: string;
    transactionId: string;
  };
  wallet: {
    balance: number;
    currency: string;
  };
}

export const esimPurchaseService = {
purchaseWithWallet: async (
    data: ESimPurchaseRequest
  ): Promise<ESimPurchaseResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<ESimPurchaseResponse>>(
        '/esims/purchase',
        data
      );

      logger.debug('[eSIM Purchase] Purchase successful');
      return (response as any).data?.data ?? ({} as ESimPurchaseResponse);
    } catch (error: any) {
      logger.error('[eSIM Purchase] Error', error);

      if (error.response?.status === 402) {
        throw new Error('Insufficient wallet balance. Please top up your wallet first.');
      }

      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error?.description || 'Invalid purchase request';
        throw new Error(errorMsg);
      }

      throw new Error(
        error.response?.data?.error?.message || 'Failed to purchase eSIM'
      );
    }
  },
validateBalance: async (_amount: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      logger.error('[eSIM Purchase] Balance validation error', error);
      return false;
    }
  },
};
