import { Router, Request, Response } from 'express';
import statusCode from 'http-status-codes';
import { z } from 'zod';
import { authenticate, authorize } from '@middleware/auth';
import { sendSuccess, sendError } from '@utils/response';
import logger from '@utils/logger';
import { LiveChatService } from './liveChat.service';

const router = Router();

const createSessionSchema = z.object({
  lunaSessionId: z.string().optional(),
  reason: z.string().max(500).optional(),
});

const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1).max(4000),
  attachments: z.array(z.string().url()).optional(),
});

const feedbackSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  categories: z.array(z.string()).optional(),
});

const updateAgentStatusSchema = z.object({
  status: z.enum(['online', 'offline', 'busy', 'away']),
});

const cannedResponseSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  category: z.string().optional(),
  shortcut: z.string().max(20).optional(),
});
router.post('/session', authenticate, async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    if (!userId) {
      return sendError(res, 'User not authenticated', undefined, statusCode.UNAUTHORIZED);
    }

    const session = await LiveChatService.createSession(userId, data);
    return sendSuccess(res, 'Live chat session created', session, statusCode.CREATED);
  } catch (error) {
    logger.error('[LiveChat] Error creating session:', error);
    return sendError(res, error instanceof Error ? error.message : 'Failed to create session', undefined, statusCode.BAD_REQUEST);
  }
});
router.get('/session/:sessionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return sendError(res, 'User not authenticated', undefined, statusCode.UNAUTHORIZED);
    }

    const session = await LiveChatService.getSessionDetails(sessionId);

    if (!session) {
      return sendError(res, 'Session not found', undefined, statusCode.NOT_FOUND);
    }

    const userRole = (req as any).user?.role;
    const agentId = (req as any).user?.agentId;
    
    const isOwner = session.userId === userId;
    const isAssignedAgent = agentId && session.agentId === agentId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    
    if (!isOwner && !isAssignedAgent && !isAdmin) {
      return sendError(res, 'Access denied', undefined, statusCode.FORBIDDEN);
    }

    return sendSuccess(res, 'Session retrieved', session, statusCode.OK);
  } catch (error) {
    logger.error('[LiveChat] Error fetching session:', error);
    return sendError(res, 'Failed to fetch session', undefined, statusCode.INTERNAL_SERVER_ERROR);
  }
});
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return sendError(res, 'User not authenticated', undefined, statusCode.UNAUTHORIZED);
    }
    const sessions = await LiveChatService.getUserSessions(userId);

    return sendSuccess(res, 'Sessions retrieved', sessions, statusCode.OK);
  } catch (error) {
    logger.error('[LiveChat] Error fetching sessions:', error);
    return sendError(res, 'Failed to fetch sessions', undefined, statusCode.INTERNAL_SERVER_ERROR);
  }
});
router.post('/message', authenticate, async (req: Request, res: Response) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    if (!userId) {
      return sendError(res, 'User not authenticated', undefined, statusCode.UNAUTHORIZED);
    }

    const message = await LiveChatService.sendMessage(
      data.sessionId,
      userId,
      'user',
      { content: data.content, attachments: data.attachments }
    );

    return sendSuccess(res, 'Message sent', message, statusCode.CREATED);
  } catch (error) {
    logger.error('[LiveChat] Error sending message:', error);
    return sendError(res, error instanceof Error ? error.message : 'Failed to send message', undefined, statusCode.BAD_REQUEST);
  }
});
router.get('/session/:sessionId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const messages = await LiveChatService.getSessionMessages(sessionId);

    return sendSuccess(res, 'Messages retrieved', messages, statusCode.OK);
  } catch (error) {
    logger.error('[LiveChat] Error fetching messages:', error);
    return sendError(res, 'Failed to fetch messages', undefined, statusCode.INTERNAL_SERVER_ERROR);
  }
});
router.post('/feedback', authenticate, async (req: Request, res: Response) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    if (!userId) {
      return sendError(res, 'User not authenticated', undefined, statusCode.UNAUTHORIZED);
    }

    const feedback = await LiveChatService.submitFeedback(data.sessionId, userId, {
      rating: data.rating,
      comment: data.comment,
      categories: data.categories,
    });

    return sendSuccess(res, 'Feedback submitted', feedback, statusCode.CREATED);
  } catch (error) {
    logger.error('[LiveChat] Error submitting feedback:', error);
    return sendError(res, 'Failed to submit feedback', undefined, statusCode.BAD_REQUEST);
  }
});
router.post('/session/:sessionId/close', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.userId;
    
    const session = await LiveChatService.getSessionDetails(sessionId);
    if (!session) {
      return sendError(res, 'Session not found', undefined, statusCode.NOT_FOUND);
    }
    
    if (session.userId !== userId) {
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return sendError(res, 'Access denied', undefined, statusCode.FORBIDDEN);
      }
    }

    const closedSession = await LiveChatService.closeSession(sessionId);
    return sendSuccess(res, 'Session closed', closedSession, statusCode.OK);
  } catch (error) {
    logger.error('[LiveChat] Error closing session:', error);
    return sendError(res, error instanceof Error ? error.message : 'Failed to close session', undefined, statusCode.BAD_REQUEST);
  }
});
router.patch('/session/:sessionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.userId;
    
    if (status !== 'closed') {
      return sendError(res, 'Invalid status. Only "closed" is supported.', undefined, statusCode.BAD_REQUEST);
    }

    const session = await LiveChatService.getSessionDetails(sessionId);
    if (!session) {
      return sendError(res, 'Session not found', undefined, statusCode.NOT_FOUND);
    }
    
    if (session.userId !== userId) {
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return sendError(res, 'Access denied', undefined, statusCode.FORBIDDEN);
      }
    }

    const closedSession = await LiveChatService.closeSession(sessionId);
    return sendSuccess(res, 'Session closed', closedSession, statusCode.OK);
  } catch (error) {
    logger.error('[LiveChat] Error updating session:', error);
    return sendError(res, error instanceof Error ? error.message : 'Failed to update session', undefined, statusCode.BAD_REQUEST);
  }
});
router.get('/canned-responses', authenticate, async (req: Request, res: Response) => {
  try {
    const responses = await LiveChatService.getCannedResponses();

    return sendSuccess(res, 'Canned responses retrieved', responses, statusCode.OK);
  } catch (error) {
    logger.error('[LiveChat] Error fetching canned responses:', error);
    return sendError(res, 'Failed to fetch canned responses', undefined, statusCode.INTERNAL_SERVER_ERROR);
  }
});
router.get(
  '/agent/sessions',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const agentId = (req as any).user?.agentId || userId;
      if (!agentId) {
        return sendError(res, 'User is not authorized to view sessions', undefined, statusCode.FORBIDDEN);
      }

      const sessions = await LiveChatService.getAgentSessions(agentId);

      return sendSuccess(res, 'Agent sessions retrieved', sessions, statusCode.OK);
    } catch (error) {
      logger.error('[LiveChat] Error fetching agent sessions:', error);
      return sendError(res, 'Failed to fetch sessions', undefined, statusCode.INTERNAL_SERVER_ERROR);
    }
  }
);
router.get(
  '/queue',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const queued = await LiveChatService.getQueuedSessions(10);

      return sendSuccess(res, 'Queue retrieved', queued, statusCode.OK);
    } catch (error) {
      logger.error('[LiveChat] Error fetching queue:', error);
      return sendError(res, 'Failed to fetch queue', undefined, statusCode.INTERNAL_SERVER_ERROR);
    }
  }
);
router.post(
  '/agent/assign',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      const adminId = (req as any).user?.userId;

      if (!sessionId) {
        return sendError(res, 'sessionId is required', undefined, statusCode.BAD_REQUEST);
      }

      if (!adminId) {
        return sendError(res, 'Admin not authenticated', undefined, statusCode.UNAUTHORIZED);
      }

      const session = await LiveChatService.assignAdminToSession(sessionId, adminId);

      return sendSuccess(res, 'Admin assigned to session', session, statusCode.OK);
    } catch (error) {
      logger.error('[LiveChat] Error assigning admin to session:', error);
      return sendError(res, error instanceof Error ? error.message : 'Failed to assign admin to session', undefined, statusCode.BAD_REQUEST);
    }
  }
);
router.post(
  '/agent/message',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const data = sendMessageSchema.parse(req.body);
      const agentId = (req as any).user?.userId;
      if (!agentId) {
        return sendError(res, 'User is not authenticated', undefined, statusCode.UNAUTHORIZED);
      }

      const message = await LiveChatService.sendMessage(
        data.sessionId,
        agentId,
        'agent',
        { content: data.content, attachments: data.attachments }
      );

      return sendSuccess(res, 'Message sent', message, statusCode.CREATED);
    } catch (error) {
      logger.error('[LiveChat] Error sending agent message:', error);
      return sendError(res, error instanceof Error ? error.message : 'Failed to send message', undefined, statusCode.BAD_REQUEST);
    }
  }
);
router.patch(
  '/agent/status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const data = updateAgentStatusSchema.parse(req.body);
      const agentId = (req as any).user?.agentId;
      if (!agentId) {
        return sendError(res, 'User is not an agent', undefined, statusCode.FORBIDDEN);
      }

      const agent = await LiveChatService.updateAgentStatus(agentId, data);

      return sendSuccess(res, 'Status updated', agent, statusCode.OK);
    } catch (error) {
      logger.error('[LiveChat] Error updating status:', error);
      return sendError(res, 'Failed to update status', undefined, statusCode.BAD_REQUEST);
    }
  }
);
router.post(
  '/canned-response',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const data = cannedResponseSchema.parse(req.body);
      const agentId = (req as any).user?.agentId;

      const response = await LiveChatService.createCannedResponse(agentId || null, data);

      return sendSuccess(res, 'Canned response created', response, statusCode.CREATED);
    } catch (error) {
      logger.error('[LiveChat] Error creating canned response:', error);
      return sendError(res, 'Failed to create canned response', undefined, statusCode.BAD_REQUEST);
    }
  }
);

export default router;
