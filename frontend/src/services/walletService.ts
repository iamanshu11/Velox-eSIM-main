import { apiClient } from '@lib/apiClient';
import type { ApiResponse } from '@/types';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  createdAt: string;
}

export const walletService = {
async getWallet(): Promise<Wallet> {
    const response = await apiClient.get<ApiResponse<Wallet>>(
      '/wallet/balance'
    );
    return response.data || { id: '', userId: '', balance: 0, currency: 'USD', createdAt: '', updatedAt: '' };
  },
async getTransactions(limit = 20, page = 1): Promise<WalletTransaction[]> {
    const response = await apiClient.get<ApiResponse<WalletTransaction[]>>(
      `/wallet/transactions?limit=${limit}&page=${page}`
    );
    return response.data || [];
  },
async topUp(amount: number): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/payments/topup/intent',
      { amount }
    );
    return response.data;
  },
async withdraw(amount: number, method: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/wallet/withdraw',
      { amount, method }
    );
    return response.data;
  },
async checkBalance(): Promise<number> {
    const wallet = await this.getWallet();
    return wallet.balance;
  },
};

export default walletService;
