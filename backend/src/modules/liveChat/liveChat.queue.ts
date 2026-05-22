import db from '@config/database';
import logger from '@utils/logger';
import { LiveChatWebSocketHandler } from './liveChat.websocket';
export class QueueService {
static async processQueue(): Promise<void> {
    try {
      const queuedSessions = await db.agentQueue.findMany({
        where: { agentId: null },
        orderBy: { positionInQueue: 'asc' },
        include: {
          session: true,
        },
      });

      if (queuedSessions.length === 0) {
        return;
      }

      const availableAgents = await this.getAvailableAgents();

      if (availableAgents.length === 0) {
        logger.warn('[Queue] No available agents to assign');
        LiveChatWebSocketHandler.toQueueMonitoring('queue:no-agents', {
          queueLength: queuedSessions.length,
        });
        return;
      }

      let agentIndex = 0;
      for (const queueEntry of queuedSessions) {
        if (agentIndex >= availableAgents.length) {
          agentIndex = 0;
        }

        const agent = availableAgents[agentIndex];
        const sessionId = queueEntry.sessionId;

        try {
          const updatedSession = await db.liveChatSession.update({
            where: { id: sessionId },
            data: {
              agentId: agent.id,
              status: 'active',
              assignedAt: new Date(),
              startedAt: new Date(),
            },
          });


          await db.agentQueue.update({
            where: { id: queueEntry.id },
            data: {
              agentId: agent.id,
              assignedAt: new Date(),
            },
          });


          await db.agent.update({
            where: { id: agent.id },
            data: { currentChatCount: { increment: 1 } },
          });

          logger.info(
            `[Queue] Session ${sessionId} assigned to agent ${agent.email}`,
          );

          LiveChatWebSocketHandler.toUser(
            updatedSession.userId,
            'agent:assigned',
            {
              sessionId,
              agentName: agent.name,
              agentEmail: agent.email,
            }
          );

          LiveChatWebSocketHandler.toAgent(agent.id, 'session:assigned', {
            sessionId,
            userId: updatedSession.userId,
          });


          this.broadcastQueueUpdate();

          agentIndex++;
        } catch (error) {
          logger.error(
            `[Queue] Error assigning session ${sessionId}:`,
            error,
          );
        }
      }
    } catch (error) {
      logger.error('[Queue] Error processing queue:', error);
    }
  }
private static async getAvailableAgents() {
    const agents = await db.agent.findMany({
      where: {
        isActive: true,
        status: { in: ['online'] },
      },
      orderBy: [
        { currentChatCount: 'asc' },
        { avgResponseTime: 'asc' },
        { totalChats: 'asc' },
      ],
    });


    return agents.filter(
      (agent) => agent.currentChatCount < agent.maxConcurrentChats,
    );
  }
static async getEstimatedWaitTime(sessionId: string): Promise<number> {
    try {
      const queueEntry = await db.agentQueue.findUnique({
        where: { sessionId },
      });

      if (!queueEntry || queueEntry.agentId) {
        return 0;
      }

      const availableAgents = await this.getAvailableAgents();

      if (availableAgents.length === 0) {
        return 600000;
      }
      const avgHandlingTime = 300000;
      const peopleAhead = queueEntry.positionInQueue - 1;
      const availableAgentCount = availableAgents.length;
      const estimatedWait =
        Math.max(
          0,
          (peopleAhead / availableAgentCount) * avgHandlingTime,
        );

      return Math.round(estimatedWait);
    } catch (error) {
      logger.error('[Queue] Error calculating wait time:', error);
      return 0;
    }
  }
static async reorderQueue(agentId?: string): Promise<void> {
    try {
      if (agentId) {
        const agentSessions = await db.liveChatSession.findMany({
          where: {
            agentId,
            status: 'active',
          },
        });

        for (const session of agentSessions) {
          await db.liveChatSession.update({
            where: { id: session.id },
            data: {
              agentId: null,
              status: 'queued',
            },
          });


          const queueEntry = await db.agentQueue.findUnique({
            where: { sessionId: session.id },
          });

          if (queueEntry) {
            await db.agentQueue.update({
              where: { id: queueEntry.id },
              data: { agentId: null, assignedAt: null },
            });
          }

          LiveChatWebSocketHandler.toUser(
            session.userId,
            'session:reassigned',
            {
              sessionId: session.id,
              reason: 'Agent disconnected',
            }
          );
        }

        await db.agent.update({
          where: { id: agentId },
          data: {
            currentChatCount: 0,
          },
        });
      }

      await this.processQueue();
    } catch (error) {
      logger.error('[Queue] Error reordering queue:', error);
    }
  }
static async updateQueuePositions(): Promise<void> {
    try {
      const queuedSessions = await db.agentQueue.findMany({
        where: { agentId: null },
        orderBy: { waitingSince: 'asc' },
      });

      for (let i = 0; i < queuedSessions.length; i++) {
        const estimatedWait = await this.getEstimatedWaitTime(
          queuedSessions[i].sessionId,
        );

        await db.agentQueue.update({
          where: { id: queuedSessions[i].id },
          data: {
            positionInQueue: i + 1,
            estimatedWaitTimeMs: estimatedWait,
          },
        });

        LiveChatWebSocketHandler.toSession(
          queuedSessions[i].sessionId,
          'queue:position-updated',
          {
            position: i + 1,
            estimatedWaitMs: estimatedWait,
            peopleAhead: i,
          }
        );
      }
    } catch (error) {
      logger.error('[Queue] Error updating queue positions:', error);
    }
  }
static async broadcastQueueUpdate(): Promise<void> {
    try {
      const queuedCount = await db.agentQueue.count({
        where: { agentId: null },
      });

      const activeCount = await db.liveChatSession.count({
        where: { status: 'active' },
      });

      LiveChatWebSocketHandler.toQueueMonitoring('queue:updated', {
        queuedCount,
        activeCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[Queue] Error broadcasting queue update:', error);
    }
  }
static async getQueueStats() {
    try {
      const queuedSessions = await db.agentQueue.count({
        where: { agentId: null },
      });

      const activeSessions = await db.liveChatSession.count({
        where: { status: 'active' },
      });

      const onlineAgents = await db.agent.count({
        where: { status: 'online', isActive: true },
      });

      const totalAgents = await db.agent.count({
        where: { isActive: true },
      });

      const avgWaitTime = await this.calculateAverageWaitTime();

      return {
        queuedSessions,
        activeSessions,
        onlineAgents,
        totalAgents,
        avgWaitTimeMs: avgWaitTime,
        queueUtilization: (activeSessions / (onlineAgents * 5)) * 100,
      };
    } catch (error) {
      logger.error('[Queue] Error fetching queue stats:', error);
      return null;
    }
  }
private static async calculateAverageWaitTime(): Promise<number> {
    try {
      const queuedSessions = await db.agentQueue.findMany({
        where: { agentId: null },
      });

      if (queuedSessions.length === 0) {
        return 0;
      }

      const now = new Date().getTime();
      const totalWaitTime = queuedSessions.reduce((sum, session) => {
        const waitTime = now - session.waitingSince.getTime();
        return sum + waitTime;
      }, 0);

      return Math.round(totalWaitTime / queuedSessions.length);
    } catch (error) {
      logger.error('[Queue] Error calculating average wait time:', error);
      return 0;
    }
  }
}

setInterval(() => {
  QueueService.processQueue().catch((error) => {
    logger.error('[Queue] Background processor error:', error);
  });
}, 5000);

setInterval(() => {
  QueueService.updateQueuePositions().catch((error) => {
    logger.error('[Queue] Position updater error:', error);
  });
}, 2000);
