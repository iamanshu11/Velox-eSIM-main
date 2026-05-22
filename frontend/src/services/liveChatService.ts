import { apiClient } from '@/lib/apiClient';
import { BackendApiResponse } from '@/types/api';

export interface CreateLiveChatSessionRequest {
  lunaSessionId?: string;
  reason?: string;
}

export interface LiveChatSessionResponse {
  id: string;
  userId: string;
  agentId: string | null;
  lunaSessionId: string | null;
  status: 'queued' | 'active' | 'closed' | 'transferred';
  reason: string | null;
  waitStartedAt: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class LiveChatService {
static async createSession(data: CreateLiveChatSessionRequest): Promise<LiveChatSessionResponse> {
    const response = await apiClient.post<BackendApiResponse<LiveChatSessionResponse>>(
      '/live-chat/session',
      data
    );
    if (!response.data) {
      throw new Error('Failed to create live chat session');
    }
    return response.data;
  }
static async getSession(sessionId: string): Promise<LiveChatSessionResponse> {
    const response = await apiClient.get<BackendApiResponse<LiveChatSessionResponse>>(
      `/live-chat/session/${sessionId}`
    );
    if (!response.data) {
      throw new Error('Failed to retrieve session');
    }
    return response.data;
  }
static async getSessions(): Promise<LiveChatSessionResponse[]> {
    const response = await apiClient.get<BackendApiResponse<LiveChatSessionResponse[]>>(
      '/live-chat/sessions'
    );
    if (!response.data) {
      return [];
    }
    return response.data;
  }
static async sendMessage(sessionId: string, content: string) {
    const response = await apiClient.post<BackendApiResponse<{ id: string }>>(
      '/live-chat/message',
      { sessionId, content }
    );
    return response.data || {};
  }
static async closeSession(sessionId: string): Promise<LiveChatSessionResponse> {
    const response = await apiClient.post<BackendApiResponse<LiveChatSessionResponse>>(
      `/live-chat/session/${sessionId}/close`,
      {}
    );
    if (!response.data) {
      throw new Error('Failed to close session');
    }
    return response.data;
  }
static async submitFeedback(sessionId: string, rating: number, comment?: string) {
    const response = await apiClient.post<BackendApiResponse<{ success: boolean }>>(
      '/live-chat/feedback',
      { sessionId, rating, comment }
    );
    return response.data || {};
  }
}
