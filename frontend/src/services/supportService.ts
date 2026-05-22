import { apiClient } from '@lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const supportService = {
  async createTicket(data: {
    subject: string;
    message: string;
    priority?: string;
    category?: string;
  }): Promise<SupportTicket> {
    const response = await apiClient.post<ApiResponse<SupportTicket>>('/support/create', data);
    return response.data!;
  },

  async getTicketById(id: string): Promise<SupportTicket> {
    const response = await apiClient.get<ApiResponse<SupportTicket>>(`/support/${id}`);
    return response.data!;
  },

  async getUserTickets(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<SupportTicket>> {
    const skip = (page - 1) * limit;
    const response = await apiClient.get<PaginatedResponse<SupportTicket>>(
      `/support/user/tickets?skip=${skip}&take=${limit}`
    );
    return response;
  },

  async getAllTickets(
    page: number = 1,
    limit: number = 10,
    filters?: { status?: string; priority?: string }
  ): Promise<PaginatedResponse<SupportTicket>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await apiClient.get<PaginatedResponse<SupportTicket>>(
      `/support/admin/tickets?${params.toString()}`
    );
    return response;
  },

  async addCommunication(ticketId: string, message: string): Promise<SupportTicket> {
    const response = await apiClient.post<ApiResponse<SupportTicket>>(
      `/support/${ticketId}/reply`,
      { message }
    );
    return response.data!;
  },

  async updateTicketStatus(id: string, status: string): Promise<SupportTicket> {
    const response = await apiClient.patch<ApiResponse<SupportTicket>>(`/support/${id}/status`, {
      status,
    });
    return response.data!;
  },
};

export default supportService;
