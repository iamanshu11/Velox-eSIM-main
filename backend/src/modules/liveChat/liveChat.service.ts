import db from '@config/database';
import logger from '@utils/logger';
import {
  LiveChatSession,
  LiveChatMessage,
  Agent,
  CannedResponse,
  LiveChatFeedback,
  AgentQueue,
  CreateLiveChatSessionDTO,
  SendLiveChatMessageDTO,
  SubmitLiveChatFeedbackDTO,
  UpdateAgentStatusDTO,
  CreateCannedResponseDTO,
} from './liveChat.types';

export class LiveChatService {
static async createSession(
    userId: string,
    data: CreateLiveChatSessionDTO
  ): Promise<LiveChatSession> {
    try {
      const existing = await db.liveChatSession.findFirst({
        where: { userId, status: { in: ['queued', 'active'] } },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        logger.info(`[LiveChat] Reusing existing session ${existing.id} for user ${userId}`);
        return existing as unknown as LiveChatSession;
      }

      const session = await db.liveChatSession.create({
        data: {
          userId,
          lunaSessionId: data.lunaSessionId,
          reason: data.reason,
          status: 'queued',
          waitStartedAt: new Date(),
        },
      });

      const queuePosition = await db.agentQueue.count();
      await db.agentQueue.create({
        data: {
          sessionId: session.id,
          positionInQueue: queuePosition + 1,
        },
      });

      logger.info(`[LiveChat] Session created: ${session.id} for user: ${userId}`);
      return session as unknown as LiveChatSession;
    } catch (error) {
      logger.error('[LiveChat] Error creating session:', error);
      throw error;
    }
  }
static async sendMessage(
    sessionId: string,
    senderId: string,
    senderRole: 'user' | 'agent',
    data: SendLiveChatMessageDTO
  ): Promise<LiveChatMessage> {
    try {
      const session = await db.liveChatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      const message = await db.liveChatMessage.create({
        data: {
          sessionId,
          senderId,
          senderRole,
          content: data.content,
          attachments: data.attachments ? (JSON.parse(JSON.stringify(data.attachments)) as any) : undefined,
        },
      });

      logger.info(`[LiveChat] Message sent in session: ${sessionId}`);
      return message as LiveChatMessage;
    } catch (error) {
      logger.error('[LiveChat] Error sending message:', error);
      throw error;
    }
  }
static async getSessionMessages(sessionId: string, limit = 50): Promise<LiveChatMessage[]> {
    try {
      return (await db.liveChatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })) as LiveChatMessage[];
    } catch (error) {
      logger.error('[LiveChat] Error fetching messages:', error);
      throw error;
    }
  }
static async getUserSessions(userId: string): Promise<LiveChatSession[]> {
    try {
      return (await db.liveChatSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      })) as unknown as LiveChatSession[];
    } catch (error) {
      logger.error('[LiveChat] Error fetching user sessions:', error);
      throw error;
    }
  }
static async getAgentSessions(agentId: string): Promise<LiveChatSession[]> {
    try {
      const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
      const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);
      await db.liveChatSession.updateMany({
        where: {
          agentId,
          status: 'active',
          startedAt: { lt: staleThreshold },
        },
        data: { status: 'closed', closedAt: new Date() },
      });

      return (await db.liveChatSession.findMany({
        where: { agentId, status: 'active' },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      })) as unknown as LiveChatSession[];
    } catch (error) {
      logger.error('[LiveChat] Error fetching agent sessions:', error);
      throw error;
    }
  }
static async assignAgent(sessionId: string): Promise<LiveChatSession> {
    try {
      const agents = await db.agent.findMany({
        where: {
          isActive: true,
          status: 'online',
        },
        orderBy: [
          { currentChatCount: 'asc' },
          { avgResponseTime: 'asc' },
        ],
      });

      const availableAgent = agents.find(
        (agent) => agent.currentChatCount < agent.maxConcurrentChats
      );

      if (!availableAgent) {
        throw new Error('No agents available');
      }

      const session = await db.liveChatSession.update({
        where: { id: sessionId },
        data: {
          agentId: availableAgent.id,
          status: 'active',
          assignedAt: new Date(),
          startedAt: new Date(),
        },
      });

      await db.agentQueue.updateMany({
        where: { sessionId },
        data: { agentId: availableAgent.id, assignedAt: new Date() },
      });

      await db.agent.update({
        where: { id: availableAgent.id },
        data: { currentChatCount: { increment: 1 } },
      });

      logger.info(`[LiveChat] Agent ${availableAgent.id} assigned to session ${sessionId}`);
      return session as unknown as LiveChatSession;
    } catch (error) {
      logger.error('[LiveChat] Error assigning admin to session:', error);
      throw error;
    }
  }

  static async assignAdminToSession(sessionId: string, adminId: string): Promise<LiveChatSession> {
    try {
      const session = await db.liveChatSession.update({
        where: { id: sessionId },
        data: {
          agentId: adminId,
          status: 'active',
          assignedAt: new Date(),
          startedAt: new Date(),
        },
      });

      await db.agentQueue.updateMany({
        where: { sessionId },
        data: { agentId: adminId, assignedAt: new Date() },
      });

      logger.info(`[LiveChat] Admin ${adminId} assigned to session ${sessionId}`);
      return session as unknown as LiveChatSession;
    } catch (error) {
      logger.error('[LiveChat] Error assigning admin to session:', error);
      throw error;
    }
  }
static async closeSession(sessionId: string): Promise<LiveChatSession> {
    try {
      const session = await db.liveChatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.agentId) {
        const agent = await db.agent.findUnique({
          where: { id: session.agentId },
        });

        if (agent) {
          await db.agent.update({
            where: { id: session.agentId },
            data: { currentChatCount: { decrement: 1 } },
          });
        }
      }

      const closedSession = await db.liveChatSession.update({
        where: { id: sessionId },
        data: { status: 'closed', closedAt: new Date() },
      });

      logger.info(`[LiveChat] Session ${sessionId} closed`);
      return closedSession as unknown as LiveChatSession;
    } catch (error) {
      logger.error('[LiveChat] Error closing session:', error);
      throw error;
    }
  }
static async submitFeedback(
    sessionId: string,
    userId: string,
    data: SubmitLiveChatFeedbackDTO
  ): Promise<LiveChatFeedback> {
    try {
      const feedback = await db.liveChatFeedback.create({
        data: {
          sessionId,
          userId,
          rating: data.rating,
          comment: data.comment,
          categories: data.categories || [],
        },
      });

      logger.info(`[LiveChat] Feedback submitted for session: ${sessionId}`);
      return feedback as LiveChatFeedback;
    } catch (error) {
      logger.error('[LiveChat] Error submitting feedback:', error);
      throw error;
    }
  }
static async getQueuedSessions(limit = 10): Promise<AgentQueue[]> {
    try {
      return (await db.agentQueue.findMany({
        where: { agentId: null },
        orderBy: { positionInQueue: 'asc' },
        take: limit,
        include: {
          session: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
        },
      })) as AgentQueue[];
    } catch (error) {
      logger.error('[LiveChat] Error fetching queued sessions:', error);
      throw error;
    }
  }
static async getAgent(agentId: string): Promise<Agent> {
    try {
      const agent = await db.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      return agent as Agent;
    } catch (error) {
      logger.error('[LiveChat] Error fetching agent:', error);
      throw error;
    }
  }
static async updateAgentStatus(agentId: string, data: UpdateAgentStatusDTO): Promise<Agent> {
    try {
      const agent = await db.agent.update({
        where: { id: agentId },
        data: { status: data.status },
      });

      logger.info(`[LiveChat] Agent ${agentId} status updated to ${data.status}`);
      return agent as Agent;
    } catch (error) {
      logger.error('[LiveChat] Error updating agent status:', error);
      throw error;
    }
  }
static async getCannedResponses(agentId?: string): Promise<CannedResponse[]> {
    try {
      return (await db.cannedResponse.findMany({
        where: agentId ? { OR: [{ agentId }, { agentId: null }] } : { agentId: null },
        orderBy: { category: 'asc' },
      })) as CannedResponse[];
    } catch (error) {
      logger.error('[LiveChat] Error fetching canned responses:', error);
      throw error;
    }
  }
static async createCannedResponse(
    agentId: string | null,
    data: CreateCannedResponseDTO
  ): Promise<CannedResponse> {
    try {
      const response = await db.cannedResponse.create({
        data: {
          agentId,
          title: data.title,
          content: data.content,
          category: data.category || 'general',
          shortcut: data.shortcut,
        },
      });

      logger.info(`[LiveChat] Canned response created: ${response.id}`);
      return response as CannedResponse;
    } catch (error) {
      logger.error('[LiveChat] Error creating canned response:', error);
      throw error;
    }
  }
static async markMessagesAsRead(sessionId: string): Promise<void> {
    try {
      await db.liveChatMessage.updateMany({
        where: { sessionId, readAt: null },
        data: { readAt: new Date() },
      });

      logger.info(`[LiveChat] Messages marked as read in session: ${sessionId}`);
    } catch (error) {
      logger.error('[LiveChat] Error marking messages as read:', error);
      throw error;
    }
  }
static async getSessionDetails(sessionId: string) {
    try {
      return await db.liveChatSession.findUnique({
        where: { id: sessionId },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          messages: { orderBy: { createdAt: 'asc' } },
          queue: true,
          feedback: true,
        },
      });
    } catch (error) {
      logger.error('[LiveChat] Error fetching session details:', error);
      throw error;
    }
  }
}
