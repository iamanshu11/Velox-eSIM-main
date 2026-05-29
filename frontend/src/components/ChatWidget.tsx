'use client';

import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import Portal from '@/components/Portal';
import TicketSubmissionModal, { TicketFormData } from '@/components/TicketSubmissionModal';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import { supportService } from '@/services/supportService';
import { LiveChatService } from '@/services/liveChatService';
import { RootState } from '@/store';
import { BackendApiResponse } from '@/types/api';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, History, PhoneOff, Plus, Send, Ticket, ThumbsDown, ThumbsUp, Trash2, UserCheck, X, Phone } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

type ChatArea = 'public' | 'dashboard' | 'admin';

interface LunaCitation {
  title: string;
  sourceType: string;
  slug?: string;
  excerpt?: string;
}

interface LunaAction {
  type: 'navigate' | 'suggest' | 'ticket' | 'ticket-preview' | 'live-chat';
  label: string;
  payload?: Record<string, unknown>;
}

interface LiveChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: 'user' | 'agent';
  content: string;
  createdAt: string;
}

type LiveChatStatus = 'connecting' | 'queued' | 'active' | 'closed';

interface LunaMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  createdAt?: string;
  citations?: LunaCitation[];
  actions?: LunaAction[];
  feedbackSubmitted?: boolean;
  isLiveMessage?: boolean;
  liveSenderRole?: 'agent' | 'user' | 'system';
}

interface LunaResponse {
  sessionId: string;
  answer: string;
  citations: LunaCitation[];
  actions: LunaAction[];
  escalationOffered: boolean;
  model: string;
}

interface LunaSessionSummary {
  id: string;
  title?: string;
  updatedAt?: string;
  lastMessage?: string;
}

interface LunaServerSession {
  id: string;
  title?: string;
  updatedAt?: string;
  messages?: Array<{
    content?: string;
  }>;
}

interface LunaServerMessage {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
  citations?: LunaCitation[];
  actions?: LunaAction[];
}

const initialMessage = (): LunaMessage => ({
  id: 'luna-intro',
  role: 'assistant',
  content:
    'I am Luna. I can help with plans, wallet questions, cancellations, refunds, activation guidance, and support escalation.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  createdAt: new Date().toISOString(),
  actions: [],
});

const hiddenPaths = ['/admin', '/login', '/register'];
const CHAT_AUTO_RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;

const getChatArea = (pathname: string): ChatArea => {
  if (pathname.startsWith('/dashboard')) {
    return 'dashboard';
  }
  if (pathname.startsWith('/admin')) {
    return 'admin';
  }
  return 'public';
};

const makeId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const detectPriority = (conversation: LunaMessage[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' => {
  const conversationText = conversation
    .map((msg) => msg.content.toLowerCase())
    .join(' ');

  const urgentKeywords = [
    'urgent',
    'critical',
    'emergency',
    'asap',
    'immediate',
    'broken',
    'not working',
    'blocked',
    'cannot',
    'unable',
  ];
  const highKeywords = ['important', 'issue', 'problem', 'error', 'fail', 'lost', 'missing'];
  const mediumKeywords = ['question', 'help', 'assistance', 'support', 'activate', 'setup'];

  if (urgentKeywords.some((keyword) => conversationText.includes(keyword))) {
    return 'URGENT';
  }
  if (highKeywords.some((keyword) => conversationText.includes(keyword))) {
    return 'HIGH';
  }
  if (mediumKeywords.some((keyword) => conversationText.includes(keyword))) {
    return 'MEDIUM';
  }
  return 'LOW';
};

const formatDayLabel = (isoDate?: string): string | null => {
  if (!isoDate) {
    return null;
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (left: Date, right: Date): boolean =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  if (isSameDay(date, today)) {
    return 'Today';
  }
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatMessageTime = (dateValue?: string): string => {
  if (!dateValue) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const isSessionStale = (updatedAt?: string): boolean => {
  if (!updatedAt) {
    return true;
  }
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return true;
  }
  return Date.now() - parsed.getTime() > CHAT_AUTO_RESUME_WINDOW_MS;
};

const mapServerMessage = (message: LunaServerMessage): LunaMessage | null => {
  if (message.role !== 'assistant' && message.role !== 'user') {
    return null;
  }
  return {
    id: message.id || makeId(),
    role: message.role,
    content: message.content,
    timestamp: formatMessageTime(message.createdAt),
    createdAt: message.createdAt,
    citations: Array.isArray(message.citations) ? message.citations : [],
    actions: Array.isArray(message.actions) ? message.actions : [],
  };
};

const mapServerSession = (session: LunaServerSession): LunaSessionSummary => ({
  id: session.id,
  title: session.title || 'Untitled chat',
  updatedAt: session.updatedAt,
  lastMessage: session.messages?.[0]?.content || '',
});

export default function ChatWidget() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LunaMessage[]>([initialMessage()]);
  const [sessions, setSessions] = useState<LunaSessionSummary[]>([]);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingSession, setIsSwitchingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<LunaSessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionMessagesCache, setSessionMessagesCache] = useState<Record<string, LunaMessage[]>>({});
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketInitialData, setTicketInitialData] = useState<Partial<TicketFormData> | undefined>();
  const [pendingTicketPreview, setPendingTicketPreview] = useState<{
    subject: string;
    description: string;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  } | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [liveChatMode, setLiveChatMode] = useState(false);
  const [liveChatSessionId, setLiveChatSessionId] = useState<string | null>(null);
  const [liveChatStatus, setLiveChatStatus] = useState<LiveChatStatus>('connecting');
  const [liveChatInput, setLiveChatInput] = useState('');
  const [liveChatSocket, setLiveChatSocket] = useState<Socket | null>(null);
  const [liveChatQueuePos, setLiveChatQueuePos] = useState<number | null>(null);
  const [agentIsTyping, setAgentIsTyping] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const liveChatTypingRef = useRef<NodeJS.Timeout | null>(null);

  const shouldHide = useMemo(
    () => hiddenPaths.some((prefix) => pathname.startsWith(prefix)),
    [pathname],
  );

  const pageContext = useMemo(
    () => ({
      path: pathname,
      area: getChatArea(pathname),
    }),
    [pathname],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setError(null);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      setShowSessionMenu(false);
    }
  }, [isOpen]);

  const fetchSessionMessages = async (targetSessionId: string): Promise<LunaMessage[]> => {
    const messagesResponse = await apiClient.get<BackendApiResponse<LunaServerMessage[]>>(
      `/chat/sessions/${targetSessionId}/messages`,
    );
    const mappedMessages = (Array.isArray(messagesResponse.data) ? messagesResponse.data : [])
      .map(mapServerMessage)
      .filter((message): message is LunaMessage => Boolean(message));
    return mappedMessages.length > 0 ? mappedMessages : [initialMessage()];
  };

  const loadSessionMessages = async (targetSessionId: string) => {
    const mappedMessages = await fetchSessionMessages(targetSessionId);
    setSessionId(targetSessionId);
    setMessages(mappedMessages);
    setSessionMessagesCache((current) => ({
      ...current,
      [targetSessionId]: mappedMessages,
    }));
  };

  const loadSessions = async (): Promise<LunaSessionSummary[]> => {
    const sessionsResponse = await apiClient.get<BackendApiResponse<LunaServerSession[]>>('/chat/sessions');
    const loadedSessions = (Array.isArray(sessionsResponse.data) ? sessionsResponse.data : [])
      .map(mapServerSession)
      .slice(0, 5);
    setSessions(loadedSessions);
    return loadedSessions;
  };

  useEffect(() => {
    if (!isAuthenticated || historyLoaded || shouldHide) {
      return;
    }

    let isCancelled = false;

    const preloadHistory = async () => {
      try {
        setHistoryLoading(true);
        const loadedSessions = await loadSessions();
        const latestSession = loadedSessions[0];

        const sessionsToPrefetch = loadedSessions.slice(0, 4);
        if (sessionsToPrefetch.length > 0) {
          void Promise.allSettled(
            sessionsToPrefetch.map(async (session) => {
              const cachedMessages = await fetchSessionMessages(session.id);
              if (!isCancelled) {
                setSessionMessagesCache((current) => ({
                  ...current,
                  [session.id]: cachedMessages,
                }));
              }
            }),
          );
        }

        if (!latestSession?.id || isCancelled) {
          setHistoryLoaded(true);
          setHistoryLoading(false);
          return;
        }

        if (isSessionStale(latestSession.updatedAt)) {
          setHistoryLoaded(true);
          setHistoryLoading(false);
          return;
        }

        const cachedMessages = sessionMessagesCache[latestSession.id];
        if (cachedMessages) {
          setSessionId(latestSession.id);
          setMessages(cachedMessages);
        } else {
          const mappedMessages = await fetchSessionMessages(latestSession.id);
          if (!isCancelled) {
            setSessionId(latestSession.id);
            setMessages(mappedMessages);
            setSessionMessagesCache((current) => ({
              ...current,
              [latestSession.id]: mappedMessages,
            }));
          }
        }

        if (!isCancelled) {
          setHistoryLoaded(true);
          setHistoryLoading(false);
        }
      } catch (error) {
        console.error('[ChatWidget] History preload error:', error);
        if (!isCancelled) {
          setHistoryLoaded(true);
          setHistoryLoading(false);
        }
      }
    };

    void preloadHistory();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, historyLoaded, shouldHide, sessionMessagesCache]);

  const ensureSession = async (): Promise<string> => {
    if (sessionId) {
      return sessionId;
    }

    try {
      const response = await apiClient.post<BackendApiResponse<{ id: string }>>('/chat/sessions', {
        pageContext,
      });
      if (!response.data?.id) {
        throw new Error('Invalid session response');
      }
      const newSessionId = response.data.id;
      setSessionId(newSessionId);
      return newSessionId;
    } catch (error) {
      console.error('[ChatWidget] Failed to create session:', error);
      throw error instanceof Error ? error : new Error('Failed to create chat session');
    }
  };

  const handleNewChat = async () => {
    setSessionId(null);
    setMessages([initialMessage()]);
    setShowSessionMenu(false);
  };

  const handleEscalateToLiveChat = async () => {
    try {
      setIsEscalating(true);
      setError(null);

      if (!isAuthenticated) {
        setError('Please log in to start a live chat with an agent.');
        return;
      }

      const liveChatSession = await LiveChatService.createSession({
        lunaSessionId: sessionId || undefined,
        reason: 'User escalated from Luna assistant',
      });

      const newSessionId = liveChatSession.id;
      setLiveChatSessionId(newSessionId);
      setLiveChatStatus('connecting');

      const pushSystem = (content: string, id: string) => {
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: 'assistant' as const,
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
            isLiveMessage: true,
            liveSenderRole: 'system' as const,
            citations: [],
            actions: [],
          },
        ]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      };

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const socket = io(wsUrl, {
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 8,
      });

      socket.on('connect', () => {
        socket.emit('session:join', { sessionId: newSessionId });
      });

      socket.on('session:joined', (data: any) => {
        const status = data?.status || data?.session?.status;
        if (status === 'active') {
          setLiveChatStatus('active');
        } else if (status === 'queued') {
          setLiveChatStatus('queued');
          pushSystem(
            'You have been added to the support queue. An agent will connect with you shortly.',
            'lc-welcome',
          );
        } else {
          setLiveChatStatus('queued');
          pushSystem(
            'You have been added to the support queue. An agent will connect with you shortly.',
            'lc-welcome',
          );
        }
      });

      socket.on('message:receive', (data: { message: LiveChatMessage } | LiveChatMessage) => {
        const msg = 'message' in data ? data.message : data;
        if (msg.senderRole === 'user') return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              role: 'assistant' as const,
              content: msg.content,
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: msg.createdAt,
              isLiveMessage: true,
              liveSenderRole: (msg.senderRole === 'agent' ? 'agent' : 'user') as 'agent' | 'user',
              citations: [],
              actions: [],
            },
          ];
        });
        setAgentIsTyping(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });
      socket.on('agent:joined', () => {
        setLiveChatStatus('active');
        pushSystem('A support agent has joined the chat.', `lc-agent-${Date.now()}`);
      });
      socket.on('agent:assigned', () => {
        setLiveChatStatus('active');
        pushSystem('A support agent has joined the chat.', `lc-agent-${Date.now()}`);
      });

      socket.on('error:message-send', (data: { message?: string }) => {
        logger.warn('[ChatWidget] Message send error:', data?.message);
        setMessages((prev) => {
          const lastIdx = [...prev].reverse().findIndex((m) => m.isLiveMessage && m.liveSenderRole === 'user');
          if (lastIdx === -1) return prev;
          const realIdx = prev.length - 1 - lastIdx;
          return prev.filter((_, i) => i !== realIdx);
        });
        setError(data?.message || 'Failed to send message. Please try again.');
      });

      socket.on('error:invalid-session', (data: { message?: string }) => {
        logger.error('[ChatWidget] Invalid session:', data?.message);
        setError('Session error: ' + (data?.message || 'Could not join session'));
        setLiveChatStatus('closed');
      });

      socket.on('error:join-session', (data: { message?: string }) => {
        logger.error('[ChatWidget] Join session error:', data?.message);
        setError('Could not connect to live chat. Please try again.');
        setLiveChatMode(false);
      });

      socket.on('queue:position-updated', (data: { position: number }) => {
        setLiveChatQueuePos(data.position);
      });

      socket.on('typing:start', () => setAgentIsTyping(true));
      socket.on('typing:stop', () => setAgentIsTyping(false));

      socket.on('session:closed', () => {
        setLiveChatStatus('closed');
        pushSystem('The chat session has ended. Thank you for contacting us.', `lc-closed-${Date.now()}`);
      });

      setLiveChatSocket(socket);
      setLiveChatMode(true);
      logger.info('[ChatWidget] Live chat started:', newSessionId);
    } catch (escalateError) {
      const message = escalateError instanceof Error ? escalateError.message : 'Failed to start live chat';
      setError(message);
      logger.error('[ChatWidget] Escalation error:', escalateError);
    } finally {
      setIsEscalating(false);
    }
  };

  const handleLiveChatSend = () => {
    const content = liveChatInput.trim();
    if (!content || !liveChatSocket || !liveChatSessionId) return;
    setLiveChatInput('');
    if (liveChatTypingRef.current) clearTimeout(liveChatTypingRef.current);
    liveChatSocket.emit('typing:stop', { sessionId: liveChatSessionId });
    liveChatSocket.emit('message:send', { sessionId: liveChatSessionId, content });
    setMessages((prev) => [
      ...prev,
      {
        id: `lc-opt-${Date.now()}`,
        role: 'user' as const,
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        isLiveMessage: true,
        liveSenderRole: 'user' as const,
        citations: [],
        actions: [],
      },
    ]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleLiveChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLiveChatInput(e.target.value);
    if (!liveChatSocket || !liveChatSessionId) return;
    liveChatSocket.emit('typing:start', { sessionId: liveChatSessionId });
    if (liveChatTypingRef.current) clearTimeout(liveChatTypingRef.current);
    liveChatTypingRef.current = setTimeout(() => {
      liveChatSocket.emit('typing:stop', { sessionId: liveChatSessionId });
    }, 2500);
  };

  const handleEndLiveChat = () => {
    if (liveChatSocket) {
      liveChatSocket.emit('session:leave', { sessionId: liveChatSessionId });
      liveChatSocket.disconnect();
    }
    setLiveChatSocket(null);
    setLiveChatMode(false);
    setLiveChatSessionId(null);
    setLiveChatStatus('connecting');
    setLiveChatQueuePos(null);
    setAgentIsTyping(false);
  };

  const handleSelectSession = async (selectedSessionId: string) => {
    const cachedMessages = sessionMessagesCache[selectedSessionId];
    if (cachedMessages) {
      setSessionId(selectedSessionId);
      setMessages(cachedMessages);
      setShowSessionMenu(false);
      setError(null);
      return;
    }

    try {
      setIsSwitchingSession(true);
      setIsLoading(true);
      setError(null);
      await loadSessionMessages(selectedSessionId);
      setShowSessionMenu(false);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : 'Failed to load selected chat session.');
      setMessages([initialMessage()]);
    } finally {
      setIsLoading(false);
      setIsSwitchingSession(false);
    }
  };

  const handleDeleteSession = async (targetSessionId: string) => {
    try {
      setDeletingSessionId(targetSessionId);
      setError(null);
      await apiClient.delete(`/chat/sessions/${targetSessionId}`);

      setSessions((current) => current.filter((session) => session.id !== targetSessionId));
      setSessionMessagesCache((current) => {
        const nextCache = { ...current };
        delete nextCache[targetSessionId];
        return nextCache;
      });

      if (sessionId === targetSessionId) {
        handleNewChat();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete chat session.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!pendingDeleteSession?.id) {
      return;
    }

    await handleDeleteSession(pendingDeleteSession.id);
    setPendingDeleteSession(null);
  };

  const handleCancelDeleteSession = () => {
    if (deletingSessionId) {
      return;
    }
    setPendingDeleteSession(null);
  };

  const submitFeedback = async (messageId: string, rating: 'up' | 'down') => {
    try {
      if (!sessionId) {
        setError('No active session. Please try again.');
        return;
      }

      await apiClient.post(`/chat/sessions/${sessionId}/feedback`, {
        messageId,
        rating,
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, feedbackSubmitted: true } : message,
        ),
      );
    } catch (feedbackError) {
      console.error('Feedback error:', feedbackError);
      setError(feedbackError instanceof Error ? feedbackError.message : 'Failed to save feedback.');
    }
  };

  const handleTicketClick = () => {
    if (!isAuthenticated) {
      setError('Please log in to submit a ticket.');
      return;
    }

    const userMessages = messages.filter((msg) => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    const priority = detectPriority(messages);

    setTicketInitialData({
      subject: lastUserMessage.slice(0, 60) || 'Support Request',
      description: messages
        .map((msg) => `${msg.role === 'user' ? 'You' : 'Luna'}: ${msg.content}`)
        .join('\n\n'),
      category: 'connectivity',
      priority,
    });
    setShowTicketModal(true);
  };

  const handleTicketPreviewAction = (action: LunaAction) => {
    if (action.type !== 'ticket-preview' || !action.payload) {
      return;
    }

    const { ticket } = action.payload as {
      ticket: {
        subject: string;
        description: string;
        category: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      };
    };

    setPendingTicketPreview(ticket);
  };

  const handleConfirmTicketPreview = async () => {
    if (!pendingTicketPreview) {
      return;
    }

    try {
      setIsSubmittingTicket(true);
      setError(null);

      const response = await supportService.createTicket({
        subject: pendingTicketPreview.subject,
        message: pendingTicketPreview.description,
        priority: pendingTicketPreview.priority,
        category: pendingTicketPreview.category as 'connectivity' | 'billing' | 'activation' | 'other',
      });

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: `Great! Your support ticket has been created successfully. Your ticket ID is: ${response.id}. Our team will review your issue and get back to you as soon as possible.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          citations: [],
          actions: [],
        },
      ]);

      setPendingTicketPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleCancelTicketPreview = () => {
    setPendingTicketPreview(null);
  };

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: LunaMessage = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const activeSessionId = await ensureSession();
      const response = await apiClient.post<BackendApiResponse<LunaResponse>>('/chat/message', {
        sessionId: activeSessionId,
        message: trimmed,
        pageContext,
      });

      const payload = response.data;
      if (!payload) {
        throw new Error('Luna returned an empty response.');
      }

      setSessionId(payload.sessionId);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: payload.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          citations: payload.citations,
          actions: payload.actions,
        },
      ]);

      if (payload.actions && payload.actions.length > 0) {
        const ticketPreviewAction = payload.actions.find((action) => action.type === 'ticket-preview');
        if (ticketPreviewAction) {
          handleTicketPreviewAction(ticketPreviewAction);
        }

        const liveChatAction = payload.actions.find((action) => action.type === 'live-chat');
        if (liveChatAction && isAuthenticated && !liveChatMode) {
          void handleEscalateToLiveChat();
        }
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send the message.');
    } finally {
      setIsLoading(false);
    }
  };

  if (shouldHide) {
    return null;
  }

  return (
    <Portal>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full cursor-pointer transition-shadow pointer-events-auto"
            aria-label="Open Luna chat"
          >
            <Image
              src="/images/luna-assistant.png"
              alt="Luna Assistant"
              fill
              className="object-cover"
              priority
            />
            <span className="absolute right-1 bottom-1 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_0_2px_rgba(255,255,255,0.95),0_0_8px_rgba(34,197,94,0.7)] border border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[min(100vw-2rem,27rem)] sm:w-[min(27rem,calc(100vw-1.25rem))] max-h-[90vh] sm:max-h-168 rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
              <div className="shrink-0 bg-linear-to-r from-[#1f5ea8] via-primary-600 to-[#43A1F0] px-4 sm:px-5 py-3 sm:py-4 text-white">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src="/images/luna-assistant.png"
                        alt="Luna"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      {liveChatMode ? (
                        <>
                          <h3 className="text-sm font-semibold text-white">Live Support</h3>
                          <p className="text-xs text-primary-100 flex items-center gap-1">
                            {liveChatStatus === 'queued' && (
                              <><motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400" />
                              {liveChatQueuePos ? `Position ${liveChatQueuePos} in queue` : 'Waiting for agent...'}</>
                            )}
                            {liveChatStatus === 'active' && (
                              <><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />Agent connected</>
                            )}
                            {liveChatStatus === 'closed' && (
                              <><span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />Session ended</>
                            )}
                            {liveChatStatus === 'connecting' && 'Connecting...'}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold text-white">Luna</h3>
                          <p className="text-xs text-primary-100">Online</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {liveChatMode ? (
                      <button
                        onClick={handleEndLiveChat}
                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/60 transition-colors flex items-center gap-1 text-xs font-medium"
                        aria-label="End live chat"
                        title="End chat and return to Luna"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleNewChat}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                          aria-label="Start new chat"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {isAuthenticated && (
                          <button
                            onClick={() => setShowSessionMenu((v) => !v)}
                            disabled={historyLoading}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                            aria-label="Chat history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        {isAuthenticated && (
                          <button
                            onClick={handleTicketClick}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            aria-label="Submit support ticket"
                          >
                            <Ticket className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Close chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col relative">
                <AnimatePresence>
                  {showSessionMenu && isAuthenticated && (
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="absolute inset-0 z-10 flex flex-col bg-white"
                    >
                      <div className="flex items-center gap-2 px-4 py-3 border-b">
                        <button
                          onClick={() => setShowSessionMenu(false)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <p className="flex-1 text-sm font-semibold">Chat history</p>
                        <button
                          onClick={() => void handleNewChat()}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-3 py-3">
                        {historyLoading ? (
                          <p className="text-xs text-slate-500">Loading...</p>
                        ) : sessions.length > 0 ? (
                          <div className="space-y-2">
                            {sessions.map((session) => (
                              <div key={session.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <button
                                  onClick={() => void handleSelectSession(session.id)}
                                  className="flex-1 text-left min-w-0"
                                >
                                  <p className="text-sm font-semibold text-slate-900 truncate">{session.title}</p>
                                  {session.lastMessage && (
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{session.lastMessage}</p>
                                  )}
                                </button>
                                <button
                                  onClick={() => setPendingDeleteSession(session)}
                                  disabled={deletingSessionId === session.id}
                                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No previous chats</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto space-y-4 bg-gray-50 px-4 py-4">
                  {messages.map((message, index) => {
                    const currentDay = formatDayLabel(message.createdAt);
                    const previousDay = index > 0 ? formatDayLabel(messages[index - 1].createdAt) : null;
                    const showDayDivider = Boolean(currentDay && currentDay !== previousDay);

                    return (
                      <div key={message.id}>
                        {showDayDivider && (
                          <div className="flex items-center justify-center my-3">
                            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full">
                              {currentDay}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${
                            message.isLiveMessage && message.liveSenderRole === 'system'
                              ? 'justify-center'
                              : message.role === 'user'
                              ? 'flex-row-reverse'
                              : 'flex-row'
                          }`}
                        >
                          {message.isLiveMessage && message.liveSenderRole === 'system' ? (
                            <div className="max-w-[90%] bg-blue-50 border border-blue-100 text-blue-800 text-xs rounded-lg px-3 py-2 text-center">
                              {message.content}
                            </div>
                          ) : (
                            <>
                          <div className="shrink-0 pt-1">
                            {message.role === 'assistant' ? (
                              message.isLiveMessage && message.liveSenderRole === 'agent' ? (
                                <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center ring-1 ring-slate-200">
                                  <UserCheck className="w-3.5 h-3.5 text-white" />
                                </div>
                              ) : (
                                <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200">
                                  <Image
                                    src="/images/luna-avatar.png"
                                    alt="Luna"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )
                            ) : user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt="User"
                                className="w-7 h-7 rounded-full ring-1 ring-slate-200 object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold ring-1 ring-slate-200 flex items-center justify-center">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>

                          <div className={`max-w-[85%] ${message.role === 'user' ? 'max-w-[75%]' : 'max-w-[80%]'}`}>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm ${
                                message.role === 'user'
                                  ? 'bg-slate-900 text-white rounded-br-none'
                                  : message.isLiveMessage
                                  ? 'bg-green-50 border border-green-100 text-slate-900 rounded-bl-none'
                                  : 'bg-white text-slate-900 shadow-sm rounded-bl-none'
                              }`}
                            >
                              {message.isLiveMessage && message.liveSenderRole === 'agent' && (
                                <p className="text-[10px] font-semibold text-primary-700 mb-1">Support Agent</p>
                              )}
                              <p className={`whitespace-pre-wrap leading-5 ${
                                message.role === 'user' ? 'text-white' : 'text-slate-900'
                              }`}>{message.content}</p>
                            </div>
                            <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'} text-slate-500`}>
                              {message.timestamp}
                            </p>
                            {message.role === 'assistant' && !message.feedbackSubmitted && message.id !== 'luna-intro' && !message.isLiveMessage && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800"
                                  icon={<ThumbsUp className="w-3 h-3" />}
                                  onClick={() => void submitFeedback(message.id, 'up')}
                                >
                                  Helpful
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800"
                                  icon={<ThumbsDown className="w-3 h-3" />}
                                  onClick={() => void submitFeedback(message.id, 'down')}
                                >
                                  Not helpful
                                </Button>
                                {isAuthenticated && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                    icon={<Phone className="w-3 h-3" />}
                                    onClick={handleEscalateToLiveChat}
                                    disabled={isEscalating || liveChatMode}
                                  >
                                    {isEscalating ? 'Connecting...' : 'Talk to agent'}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                            </>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}

                  {isLoading && !isSwitchingSession && (
                    <div className="flex gap-3">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200 shrink-0">
                        <Image
                          src="/images/luna-avatar.png"
                          alt="Luna"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -3, 0] }}
                              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                              className="w-2 h-2 rounded-full bg-primary-600"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {pendingTicketPreview && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="flex-1 bg-blue-50 px-4 py-3 rounded-2xl shadow-sm border border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Preview Your Ticket</h3>
                        <div className="space-y-2 text-sm mb-3">
                          <div>
                            <p className="text-gray-600 font-medium">Subject</p>
                            <p className="text-gray-900">{pendingTicketPreview.subject}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Priority</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              pendingTicketPreview.priority === 'URGENT' ? 'bg-red-200 text-red-800' :
                              pendingTicketPreview.priority === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                              pendingTicketPreview.priority === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-green-200 text-green-800'
                            }`}>
                              {pendingTicketPreview.priority}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Description</p>
                            <p className="text-gray-900 line-clamp-2">{pendingTicketPreview.description.slice(0, 100)}...</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-primary-600 hover:bg-primary-700 text-white"
                            onClick={() => void handleConfirmTicketPreview()}
                            disabled={isSubmittingTicket}
                          >
                            {isSubmittingTicket ? 'Creating...' : 'Confirm & Submit'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                            onClick={handleCancelTicketPreview}
                            disabled={isSubmittingTicket}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {agentIsTyping && liveChatMode && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center ring-1 ring-slate-200 shrink-0">
                        <UserCheck className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-green-50 border border-green-100 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -3, 0] }}
                              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                              className="w-2 h-2 rounded-full bg-primary-600"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="shrink-0 bg-white border-t px-4 py-3 sm:py-4">
                {error && (
                  <div className="mb-2 text-xs bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}
                {liveChatMode ? (
                  liveChatStatus === 'closed' ? (
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-2">Session ended</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEndLiveChat}
                        className="w-full text-xs"
                      >
                        Return to Luna
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={liveChatInput}
                        onChange={handleLiveChatInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleLiveChatSend();
                          }
                        }}
                        placeholder={
                          liveChatStatus === 'queued'
                            ? 'Type a message — agent will see it when they join...'
                            : 'Type your message to the agent...'
                        }
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-primary-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pointer-events-auto"
                      />
                      <Button
                        onClick={handleLiveChatSend}
                        disabled={!liveChatInput.trim()}
                        className="bg-primary-700 text-white hover:bg-primary-800 px-3 py-2.5"
                        icon={<Send className="w-4 h-4" />}
                      >
                        Send
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                      placeholder={
                        isAuthenticated
                          ? 'Ask Luna anything...'
                          : 'Ask about plans, pricing, or activation'
                      }
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-primary-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pointer-events-auto font-medium"
                    />
                    <Button
                      onClick={() => void handleSendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-primary-700 text-white hover:bg-primary-800 px-3 py-2.5"
                      icon={<Send className="w-4 h-4" />}
                    >
                      Send
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <TicketSubmissionModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSuccess={(ticketId) => {
          setMessages((current) => [
            ...current,
            {
              id: makeId(),
              role: 'assistant',
              content: `Great! Your support ticket has been created successfully. Your ticket ID is: ${ticketId}. Our team will review your issue and get back to you as soon as possible.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: new Date().toISOString(),
              citations: [],
              actions: [],
            },
          ]);
        }}
        initialData={ticketInitialData}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteSession)}
        title="Delete chat?"
        description="This cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
        isDangerous
        isLoading={Boolean(deletingSessionId)}
        onConfirm={() => void handleConfirmDeleteSession()}
        onCancel={handleCancelDeleteSession}
      />
    </Portal>
  );
}
