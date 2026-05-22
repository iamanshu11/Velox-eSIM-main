import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { LiveChatService } from '@modules/liveChat/liveChat.service';
import logger from '@utils/logger';
import jwt from 'jsonwebtoken';
import { secrets } from '@config/env';

interface SocketUser {
  userId: string;
  email: string;
  role: string;
  agentId?: string;
}

export class LiveChatWebSocketHandler {
  private static instance: SocketIOServer;

  static initialize(httpServer: HTTPServer): SocketIOServer {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      ...(process.env.FRONTEND_URL
        ? [
            process.env.FRONTEND_URL.replace('https://', 'http://'),
            process.env.FRONTEND_URL.replace('http://', 'https://'),
            process.env.FRONTEND_URL.replace('https://www.', 'https://'),
            process.env.FRONTEND_URL.replace('https://', 'https://www.'),
          ]
        : []),
    ].filter(Boolean);

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (allowedOrigins.some((o) => origin === o || origin.startsWith(o))) {
            return callback(null, true);
          }
          logger.warn(`[WebSocket] CORS blocked origin: ${origin}`);
          return callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });
    io.use((socket, next) => {
      let token: string | null = null;
      if (socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      } else if (socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie
          .split(';')
          .map((c) => c.trim());
        const accessTokenCookie = cookies.find((c) => c.startsWith('accessToken='));
        if (accessTokenCookie) {
          token = accessTokenCookie.split('=')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, secrets.jwt_secret) as SocketUser;
        const socketAsAny = socket as any;
        socketAsAny.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const socketAsAny = socket as any;
      const user = socketAsAny.user as SocketUser;
      logger.info(`[WebSocket] User ${user.userId} connected. Socket: ${socket.id}`);
      socket.join(`user:${user.userId}`);
      if (user.agentId) {
        socket.join(`agent:${user.agentId}`);
      }
socket.on('message:send', async (data: { sessionId: string; content: string }) => {
        try {
          logger.info(`[WebSocket] Message from user ${user.userId} in session ${data.sessionId}`);

          const message = await LiveChatService.sendMessage(
            data.sessionId,
            user.userId,
            'user',
            { content: data.content }
          );
          socket.to(`session:${data.sessionId}`).emit('message:receive', {
            sessionId: data.sessionId,
            message,
          });
          socket.emit('message:sent', message);
        } catch (error) {
          logger.error('[WebSocket] Error sending message:', error);
          socket.emit('error:message-send', {
            message: error instanceof Error ? error.message : 'Failed to send message',
          });
        }
      });
socket.on('typing:start', (data: { sessionId: string }) => {
        logger.debug(`[WebSocket] User ${user.userId} typing in session ${data.sessionId}`);
        socket.to(`session:${data.sessionId}`).emit('typing:start', {
          sessionId: data.sessionId,
          userId: user.userId,
        });
      });
socket.on('typing:stop', (data: { sessionId: string }) => {
        socket.to(`session:${data.sessionId}`).emit('typing:stop', {
          sessionId: data.sessionId,
          userId: user.userId,
        });
      });
socket.on('session:join', async (data: { sessionId: string }) => {
        try {
          logger.info(`[WebSocket] User ${user.userId} joining session ${data.sessionId}`);

          const session = await LiveChatService.getSessionDetails(data.sessionId);

          if (!session) {
            socket.emit('error:invalid-session', { message: 'Session not found' });
            return;
          }
          const isOwner = session.userId === user.userId;
          const isAssignedAgent = user.agentId && session.agentId === user.agentId;
          const isAdmin = user.userId === session.agentId;

          if (!isOwner && !isAssignedAgent && !isAdmin) {
            socket.emit('error:invalid-session', { message: 'Unauthorized access to session' });
            return;
          }

          const socketAsAny = socket as any;
          socketAsAny.currentSession = session;
          socket.join(`session:${data.sessionId}`);
          if (!isOwner) {
            socket.join(`agent:${user.userId}`);
          }

          if (isOwner) {
            if (session.agentId) {
              io.to(`agent:${session.agentId}`).emit('user:joined', {
                sessionId: data.sessionId,
                userId: user.userId,
                userName: user.email,
              });
            }
          } else {
            io.to(`user:${session.userId}`).emit('agent:joined', {
              sessionId: data.sessionId,
              agentId: user.userId,
            });
          }

          socket.emit('session:joined', session);
        } catch (error) {
          logger.error('[WebSocket] Error joining session:', error);
          socket.emit('error:join-session', {
            message: error instanceof Error ? error.message : 'Failed to join session',
          });
        }
      });
socket.on('session:leave', (data: { sessionId: string }) => {
        socket.leave(`session:${data.sessionId}`);
        const socketAsAny = socket as any;
        socketAsAny.currentSession = null;
        logger.info(`[WebSocket] User ${user.userId} left session ${data.sessionId}`);
      });
socket.on('agent:message-send', async (data: { sessionId: string; content: string }) => {
        try {
          const session = await LiveChatService.getSessionDetails(data.sessionId);
          if (!session) {
            socket.emit('error:session-not-found', { message: 'Session not found' });
            return;
          }
          const isAssignedAgent = session.agentId === user.userId;
          const isAdmin = !user.agentId;

          if (!isAssignedAgent && !isAdmin) {
            socket.emit('error:not-agent', { message: 'User is not assigned to this session' });
            return;
          }

          logger.info(`[WebSocket] Message from agent ${user.userId} in session ${data.sessionId}`);

          const message = await LiveChatService.sendMessage(
            data.sessionId,
            user.userId,
            'agent',
            { content: data.content }
          );
          io.to(`session:${data.sessionId}`).emit('message:receive', {
            sessionId: data.sessionId,
            message,
          });
          io.to(`user:${session.userId}`).emit('message:receive', {
            sessionId: data.sessionId,
            message,
          });

          socket.emit('message:sent', message);
        } catch (error) {
          logger.error('[WebSocket] Error sending agent message:', error);
          socket.emit('error:message-send', {
            message: error instanceof Error ? error.message : 'Failed to send message',
          });
        }
      });
socket.on('agent:session-join', async (data: { sessionId: string }) => {
        try {
          logger.info(`[WebSocket] Agent/Admin ${user.userId} joining session ${data.sessionId}`);

          const session = await LiveChatService.getSessionDetails(data.sessionId);

          if (!session) {
            socket.emit('error:invalid-session', { message: 'Session not found' });
            return;
          }
          const isAssignedAgent = session.agentId === user.userId;
          const isAdmin = !user.agentId;

          if (!isAssignedAgent && !isAdmin) {
            socket.emit('error:invalid-session', { message: 'You are not assigned to this session' });
            return;
          }

          socket.join(`session:${data.sessionId}`);

          io.to(`user:${session.userId}`).emit('agent:joined', {
            sessionId: data.sessionId,
            agentName: user.email,
          });

          socket.emit('session:joined', session);
        } catch (error) {
          logger.error('[WebSocket] Error agent joining session:', error);
          socket.emit('error:join-session', {
            message: error instanceof Error ? error.message : 'Failed to join session',
          });
        }
      });
socket.on('agent:session-close', async (data: { sessionId: string }) => {
        try {
          const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
          if (!isAdmin && !user.agentId) {
            socket.emit('error:not-agent', { message: 'User is not an agent' });
            return;
          }

          logger.info(`[WebSocket] Agent/Admin ${user.userId} closing session ${data.sessionId}`);

          const closedSession = await LiveChatService.closeSession(data.sessionId);

          io.to(`session:${data.sessionId}`).emit('session:closed', {
            sessionId: data.sessionId,
            reason: 'Agent ended the chat',
          });

          socket.emit('session:close-confirmed', closedSession);
        } catch (error) {
          logger.error('[WebSocket] Error closing session:', error);
          socket.emit('error:close-session', {
            message: error instanceof Error ? error.message : 'Failed to close session',
          });
        }
      });
socket.on('agent:queue-join', () => {
        if (!user.agentId) {
          socket.emit('error:not-agent', { message: 'User is not an agent' });
          return;
        }

        socket.join('queue:monitoring');
        logger.info(`[WebSocket] Agent ${user.agentId} joined queue monitoring`);
      });
socket.on('agent:queue-leave', () => {
        socket.leave('queue:monitoring');
        logger.info(`[WebSocket] Agent ${user.agentId} left queue monitoring`);
      });

      socket.on('disconnect', () => {
        logger.info(`[WebSocket] User ${user.userId} disconnected. Socket: ${socket.id}`);
      });

      socket.on('error', (error) => {
        logger.error(`[WebSocket] Error for user ${user.userId}:`, error);
      });
    });

    this.instance = io;
    return io;
  }
static broadcast(event: string, data: Record<string, unknown>) {
    this.instance.emit(event, data);
  }
static toUser(userId: string, event: string, data: Record<string, unknown>) {
    this.instance.to(`user:${userId}`).emit(event, data);
  }
static toSession(sessionId: string, event: string, data: Record<string, unknown>) {
    this.instance.to(`session:${sessionId}`).emit(event, data);
  }
static toAgent(agentId: string, event: string, data: Record<string, unknown>) {
    this.instance.to(`agent:${agentId}`).emit(event, data);
  }
static toQueueMonitoring(event: string, data: Record<string, unknown>) {
    this.instance.to('queue:monitoring').emit(event, data);
  }
static getInstance(): SocketIOServer {
    return this.instance;
  }
}

