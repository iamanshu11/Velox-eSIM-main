'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Phone, AlertCircle, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Button from '@/components/Button';
import logger from '@/lib/logger';

interface LiveChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: 'user' | 'agent';
  content: string;
  createdAt: string;
}

interface LiveChatSession {
  id: string;
  status: 'queued' | 'active' | 'closed' | 'transferred';
  agentId: string | null;
  estimatedWaitMs?: number;
  queuePosition?: number;
}

interface LiveChatWidgetProps {
  sessionId: string;
  onClose?: () => void;
  autoExpand?: boolean;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  sessionId,
  onClose,
  autoExpand = false,
}) => {
  const [isOpen, setIsOpen] = useState(autoExpand);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [session, setSession] = useState<LiveChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [systemMessageShown, setSystemMessageShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'authToken') return decodeURIComponent(value);
    }
    return null;
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      logger.warn('[LiveChat] No auth token found');
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      logger.info('[LiveChat] Connected to WebSocket');
      newSocket.emit('session:join', { sessionId });
    });

    newSocket.on('message:receive', (data: { message: LiveChatMessage }) => {
      setMessages((prev) => [...prev, data.message]);
    });

    newSocket.on('queue:position-updated', (data) => {
      setQueuePosition(data.position);
      setEstimatedWait(data.estimatedWaitMs);
    });

    newSocket.on('agent:assigned', (data) => {
      setSession((prev) => (prev ? { ...prev, status: 'active', agentId: data.agentId } : null));
      logger.info('[LiveChat] Agent assigned:', data.agentName);
    });

    newSocket.on('typing:start', () => {
      setIsTyping(true);
    });

    newSocket.on('typing:stop', () => {
      setIsTyping(false);
    });

    newSocket.on('session:closed', () => {
      setSession((prev) => (prev ? { ...prev, status: 'closed' } : null));
    });

    newSocket.on('error:message-send', (data) => {
      logger.error('[LiveChat] Error:', data.message);
    });

    newSocket.on('disconnect', () => {
      logger.info('[LiveChat] Disconnected from WebSocket');
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('session:leave', { sessionId });
      newSocket.disconnect();
    };
  }, [sessionId, getAuthToken]);
  useEffect(() => {
    if (isOpen && !systemMessageShown && messages.length === 0) {
      setMessages([
        {
          id: 'system-welcome',
          sessionId,
          senderId: 'system',
          senderRole: 'agent',
          content:
            'Welcome! You have been added to our support queue. Our team will connect with you shortly. You can type a message below while you wait, and an agent will see it when they connect.',
          createdAt: new Date().toISOString(),
        },
      ]);
      setSystemMessageShown(true);
    }
  }, [isOpen, systemMessageShown, sessionId, messages.length]);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !socket) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsLoading(true);

    try {
      socket.emit('message:send', {
        sessionId,
        content,
      });
      setIsLoading(false);
    } catch (error) {
      logger.error('[LiveChat] Error sending message:', error);
      setIsLoading(false);
    }
  }, [messageInput, socket, sessionId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (socket && !isTyping) {
      socket.emit('typing:start', { sessionId });
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('typing:stop', { sessionId });
        setIsTyping(false);
      }
    }, 3000);
  }, [socket, sessionId, isTyping]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatWaitTime = (ms: number | null) => {
    if (!ms) return 'Less than 1 minute';
    const minutes = Math.ceil(ms / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:shadow-xl"
        title="Live Chat Support"
      >
        <Phone className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 w-96 max-h-96 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold">Live Chat Support</h3>
            <p className="text-sm text-blue-100">
              {session?.status === 'queued'
                ? `Position: ${queuePosition || '...'} in queue`
                : session?.status === 'active'
                ? '🟢 Connected with an agent'
                : session?.status === 'closed'
                ? '⚫ Chat ended'
                : 'Connecting...'}
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="p-1 hover:bg-blue-500 rounded transition-colors ml-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue Status - Enhanced */}
        {session?.status === 'queued' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-linear-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
              <span>Waiting for next available agent</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded px-2 py-1.5 text-blue-900">
                <div className="text-gray-500">Position in queue</div>
                <div className="font-bold text-lg">{queuePosition || '-'}</div>
              </div>
              <div className="bg-white rounded px-2 py-1.5 text-blue-900">
                <div className="text-gray-500">Estimated wait</div>
                <div className="font-bold">{formatWaitTime(estimatedWait)}</div>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              💡 You can type a message now and the agent will see it when they connect.
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start a conversation with our support team</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderRole === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">{formatTime(msg.createdAt)}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {session?.status !== 'closed' && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading || session?.status === 'queued'}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !messageInput.trim() || session?.status === 'queued'}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Closed State */}
        {session?.status === 'closed' && (
          <div className="p-4 bg-gray-100 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">This chat session has ended.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="mt-2 w-full"
            >
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveChatWidget;
