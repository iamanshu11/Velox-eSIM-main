import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface BillingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'charge' | 'refund';
}

export interface BillingStatement {
  id: string;
  userId: string;
  month: string;
  monthYear: string;
  totalAmount: number;
  transactionCount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
  transactions: BillingTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingStats {
  totalBilled: number;
  averageMonthly: number;
  currentMonthAmount: number;
  statementHistory: Array<{
    month: string;
    amount: number;
  }>;
}

export interface GetStatementParams {
  month?: string;
}

export const billingService = {
  async getCurrentStatement(month?: string): Promise<BillingStatement> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    
    const response = await apiClient.get<ApiResponse<BillingStatement>>(
      `/payments/billing/statement${params.toString() ? '?' + params.toString() : ''}`
    );
    return response.data!;
  },

  async getStatements(page: number = 1, limit: number = 10): Promise<PaginatedResponse<BillingStatement>> {
    const response = await apiClient.get<PaginatedResponse<BillingStatement>>(
      `/payments/billing/statements?page=${page}&limit=${limit}`
    );
    return response;
  },

  async getStats(): Promise<BillingStats> {
    const response = await apiClient.get<ApiResponse<BillingStats>>('/payments/billing/stats');
    return response.data!;
  },

  async downloadInvoice(statementId: string): Promise<Blob> {
    const response = await fetch(
      `/payments/billing/statement/${statementId}/invoice`,
      { method: 'GET' }
    );
    return response.blob();
  },
};

export default billingService;
