import { apiClient } from '@/lib/apiClient';
import type { ApiResponse } from '@/types';
import logger from '@/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  userId: string;
  paymentId?: string;
  orderId?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  dueDate?: string;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePayload {
  invoices: InvoiceRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const invoiceService = {
  async getUserInvoices(page = 1, limit = 20): Promise<InvoicePayload> {
    const response = await apiClient.get<ApiResponse<InvoicePayload>>(
      `/payments/invoices?page=${page}&limit=${limit}`,
    );
    return response.data!;
  },

  async downloadInvoiceByPayment(paymentId: string): Promise<Blob> {
    const apiUrl = `${API_BASE_URL}/api/payments/invoices/download?paymentId=${encodeURIComponent(paymentId)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[InvoiceService] Download failed', errorText);
      throw new Error('Failed to download invoice');
    }

    return response.blob();
  },

  async getAdminInvoices(page = 1, limit = 50): Promise<InvoicePayload> {
    const response = await apiClient.get<ApiResponse<InvoicePayload>>(
      `/admin/invoices?page=${page}&limit=${limit}`,
    );
    return response.data!;
  },

  async downloadAdminInvoice(invoiceId: string): Promise<Blob> {
    const apiUrl = `${API_BASE_URL}/api/admin/invoices/${encodeURIComponent(invoiceId)}/download`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[InvoiceService] Admin download failed', errorText);
      throw new Error('Failed to download invoice');
    }

    return response.blob();
  },
};

export default invoiceService;
