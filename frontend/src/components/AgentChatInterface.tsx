'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, AlertCircle, CheckCheck, HeadphonesIcon, MessageSquare, XCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { apiClient } from '@/lib/apiClient';
import Button from '@/components/Button';
import logger from '@/lib/logger';

interface LiveMessage {
  id: string;
  senderId: string;
  senderRole: 'user' | 'agent';
  content: string;
  createdAt: string;
}

interface LunaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface AgentSession {
  id: string;
  userId: string;
  status: 'queued' | 'active' | 'closed';
  lunaSessionId?: string;
  messages: LiveMessage[];
  reason?: string;
  createdAt: string;
  user?: { id: string; name?: string; email: string; avatar?: string };
}
type ThreadEntry =
  | { kind: 'luna-user'; id: string; content: string; createdAt?: string }
  | { kind: 'luna-bot'; id: string; content: string; createdAt?: string }
  | { kind: 'divider'; id: string; label: string }
  | { kind: 'live-user'; id: string; content: string; createdAt: string }
  | { kind: 'live-agent'; id: string; content: string; createdAt: string };

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
  shortcut?: string;
}

interface AgentChatProps {
  sessionId: string;
  onClose: () => void;
  onSessionClosed?: (sessionId: string) => void;
}

function CustomerAvatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <div className="shrink-0 relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200">
        <Image src={avatar} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold select-none ring-1 ring-gray-700">
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function LunaAvatar() {
  return (
    <div className="shrink-0 relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200">
      <Image src="/images/luna-avatar.png" alt="Luna" fill className="object-cover" />
    </div>
  );
}

function AgentAvatar() {
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-primary-800 flex items-center justify-center ring-1 ring-primary-700">
      <HeadphonesIcon className="w-3.5 h-3.5 text-white" />
    </div>
  );
}

export default function AgentChatInterface({ sessionId, onClose, onSessionClosed }: AgentChatProps) {
  const [session, setSession] = useState<AgentSession | null>(null);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [lunaHistory, setLunaHistory] = useState<LunaMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [showCanned, setShowCanned] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiClient.get<any>(`/live-chat/session/${sessionId}`);
        const sessionData = response?.data;
        if (sessionData) {
          setSession(sessionData);
          setLiveMessages(sessionData.messages || []);

          if (sessionData.lunaSessionId) {
            try {
              const lunaResponse = await apiClient.get<any>(
                `/chat/sessions/${sessionData.lunaSessionId}/messages`
              );
              const lunaMsgs: LunaMessage[] = lunaResponse?.data || lunaResponse || [];
              setLunaHistory(Array.isArray(lunaMsgs) ? lunaMsgs : []);
            } catch {
            }
          }
        }
      } catch (err) {
        logger.error('[Agent Chat] Error fetching session:', err);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    void fetchSession();
  }, [sessionId]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(wsUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 8,
    });

    socket.on('connect', () => {
      logger.info('[Agent Chat] WS connected, joining session:', sessionId);
      socket.emit('session:join', { sessionId });
    });

    socket.on('message:receive', (data: any) => {
      const msg: LiveMessage = data.message || data;
      if (!msg?.id) return;
      setLiveMessages((prev) => {
        const withoutOpt = prev.filter(
          (m) => !(m.id.startsWith('opt-') && m.senderRole === msg.senderRole && m.content === msg.content)
        );
        if (withoutOpt.some((m) => m.id === msg.id)) return withoutOpt;
        return [
          ...withoutOpt,
          {
            id: msg.id,
            senderId: msg.senderId,
            senderRole: msg.senderRole,
            content: msg.content,
            createdAt: msg.createdAt || new Date().toISOString(),
          },
        ];
      });
      setIsTyping(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    socket.on('typing:start', () => setIsTyping(true));
    socket.on('typing:stop', () => setIsTyping(false));
    socket.on('error:message-send', (data: any) => setError(data?.message || 'Failed to send'));
    socket.on('disconnect', () => logger.warn('[Agent Chat] WS disconnected'));

    socket.on('session:closed', (data: any) => {
      const closedId: string = data?.id || sessionId;
      setSession((prev) => prev ? { ...prev, status: 'closed' } : prev);
      setIsTyping(false);
      setTimeout(() => onSessionClosed?.(closedId), 0);
    });
    socket.on('session:close-confirmed', (data: any) => {
      const closedId: string = data?.id || sessionId;
      setSession((prev) => prev ? { ...prev, status: 'closed' } : prev);
      setClosing(false);
      setTimeout(() => onSessionClosed?.(closedId), 0);
    });
    socket.on('error:close-session', (data: any) => {
      setError(data?.message || 'Failed to close session');
      setClosing(false);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [sessionId]);

  useEffect(() => {
    apiClient.get<any>('/live-chat/canned-responses')
      .then((res) => {
        const arr = res?.data || res || [];
        setCannedResponses(Array.isArray(arr) ? arr : []);
      })
      .catch(() => { /* optional */ });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, lunaHistory]);

  const thread = useMemo<ThreadEntry[]>(() => {
    const entries: ThreadEntry[] = [];

    for (const m of lunaHistory) {
      entries.push(
        m.role === 'user'
          ? { kind: 'luna-user', id: `sh-${m.id}`, content: m.content, createdAt: m.createdAt }
          : { kind: 'luna-bot', id: `sh-${m.id}`, content: m.content, createdAt: m.createdAt }
      );
    }

    if (lunaHistory.length > 0) {
      entries.push({ kind: 'divider', id: 'live-start', label: 'Live support started' });
    }

    for (const m of liveMessages) {
      entries.push(
        m.senderRole === 'agent'
          ? { kind: 'live-agent', id: m.id, content: m.content, createdAt: m.createdAt }
          : { kind: 'live-user', id: m.id, content: m.content, createdAt: m.createdAt }
      );
    }

    return entries;
  }, [lunaHistory, liveMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing:start', { sessionId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { sessionId });
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing:stop', { sessionId });

    const optimistic: LiveMessage = {
      id: `opt-${Date.now()}`,
      senderId: 'agent',
      senderRole: 'agent',
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      if (socketRef.current?.connected) {
        setLiveMessages((prev) => [...prev, optimistic]);
        socketRef.current.emit('agent:message-send', { sessionId, content });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      } else {
        await apiClient.post<any>('/live-chat/agent/message', { sessionId, content });
        setLiveMessages((prev) => [...prev, { ...optimistic, id: `http-${Date.now()}` }]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send message');
      setInput(content);
      setLiveMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = async () => {
    setClosing(true);
    setShowEndConfirm(false);
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit('agent:session-close', { sessionId });
      } else {
        await apiClient.post<any>(`/live-chat/session/${sessionId}/close`, {});
        setSession((prev) => prev ? { ...prev, status: 'closed' } : prev);
        setClosing(false);
        onSessionClosed?.(sessionId);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to close session');
      setClosing(false);
    }
  };

  const handleCloseChat = () => {
    socketRef.current?.disconnect();
    onClose();
  };

  const customerName =
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    `Customer ${session?.userId?.slice(0, 6) ?? ''}`;

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 flex items-center justify-center"
        style={{ height: '540px' }}
      >
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-xl border border-gray-200 flex flex-col"
      style={{ height: '540px' }}
    >
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center rounded-xl"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 mx-4 max-w-xs w-full"
            >
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 text-center">End this chat?</h3>
              <p className="text-sm text-gray-500 text-center mt-1 mb-5">
                The session will be closed and the customer will be notified.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={() => setShowEndConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                  onClick={() => void handleEndSession()}
                  disabled={closing}
                >
                  {closing ? 'Closing...' : 'End Chat'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col overflow-hidden rounded-xl flex-1">

      <div className="shrink-0 px-4 py-3 flex items-center justify-between bg-linear-to-r from-primary-900 to-primary-700">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {session?.user?.avatar ? (
            <div className="shrink-0 relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/30">
              <Image src={session.user.avatar} alt={customerName} fill className="object-cover" />
            </div>
          ) : (
            <div className="shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {customerName[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{customerName}</p>
            <p className="text-xs text-primary-200 truncate">
              {session?.status === 'active' ? 'Connected' : session?.status}
              {session?.reason ? ` · ${session.reason.slice(0, 32)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          {session?.status !== 'closed' && (
            <Button
              size="sm"
              onClick={() => setShowEndConfirm(true)}
              disabled={closing}
              icon={<XCircle className="w-3.5 h-3.5" />}
              className="bg-red-600 hover:bg-red-700 border-0 text-white text-xs px-2.5 py-1.5 h-auto"
            >
              End Chat
            </Button>
          )}
          <button
            onClick={handleCloseChat}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs underline">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 min-h-0">
        {thread.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Say hello to get started!</p>
          </div>
        ) : (
          thread.map((entry, i) => {
            if (entry.kind === 'divider') {
              return (
                <div key={entry.id} className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-primary-200" />
                  <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider whitespace-nowrap">
                    {entry.label}
                  </span>
                  <div className="flex-1 h-px bg-primary-200" />
                </div>
              );
            }

            if (entry.kind === 'luna-user') {
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="flex items-end gap-2 justify-start"
                >
                  <CustomerAvatar name={customerName} avatar={session?.user?.avatar} />
                  <div className="max-w-[76%] bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-none px-3 py-2 text-xs shadow-sm">
                    <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{customerName}</p>
                    <p className="leading-5 text-gray-900">{entry.content}</p>
                    {entry.createdAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(entry.createdAt)}</p>
                    )}
                  </div>
                </motion.div>
              );
            }

            if (entry.kind === 'luna-bot') {
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="flex items-end gap-2 justify-start"
                >
                  <LunaAvatar />
                  <div className="max-w-[76%] bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-none px-3 py-2 text-xs shadow-sm">
                    <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">Luna</p>
                    <p className="leading-5 text-gray-900">{entry.content}</p>
                    {entry.createdAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(entry.createdAt)}</p>
                    )}
                  </div>
                </motion.div>
              );
            }

            if (entry.kind === 'live-user') {
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2 justify-start"
                >
                  <CustomerAvatar name={customerName} avatar={session?.user?.avatar} />
                  <div className="max-w-[76%] bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-none px-3 py-2 text-sm shadow-sm">
                    <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{customerName}</p>
                    <p className="leading-5 text-gray-900">{entry.content}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(entry.createdAt)}</p>
                  </div>
                </motion.div>
              );
            }

            if (entry.kind === 'live-agent') {
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2 justify-end"
                >
                  <div className="max-w-[76%] bg-primary-800 text-white rounded-2xl rounded-br-none px-3 py-2 text-sm shadow-sm">
                    <p className="text-[10px] font-semibold text-primary-200 mb-0.5">You (Agent)</p>
                    <p className="leading-5 text-white">{entry.content}</p>
                    <p className="text-[10px] text-primary-300 text-right mt-0.5">{formatTime(entry.createdAt)}</p>
                  </div>
                  <AgentAvatar />
                </motion.div>
              );
            }

            return null;
          })
        )}

        {isTyping && (
          <div className="flex items-end gap-2 justify-start">
            <CustomerAvatar name={customerName} avatar={session?.user?.avatar} />
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-gray-400"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {session?.status === 'closed' ? (
        <div className="shrink-0 border-t border-gray-200 px-4 py-4 bg-gray-50 flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Session Closed</p>
          <p className="text-xs text-gray-400">This conversation has ended.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCloseChat}
            className="mt-1 text-xs text-gray-600"
          >
            Dismiss
          </Button>
        </div>
      ) : (
        <div className="shrink-0 border-t border-gray-200 bg-white">
          {cannedResponses.length > 0 && (
            <div className="px-3 pt-2">
              <button
                onClick={() => setShowCanned((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-700 hover:text-primary-900 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Quick replies
                {showCanned ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showCanned && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1.5 py-2">
                      {cannedResponses.map((cr) => (
                        <button
                          key={cr.id}
                          onClick={() => {
                            setInput(cr.content);
                            setShowCanned(false);
                          }}
                          className="text-[11px] bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 rounded-lg px-2.5 py-1 transition-colors text-left max-w-45 truncate"
                          title={cr.content}
                        >
                          {cr.title}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {/* Input row */}
          <div className="px-3 py-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !sending) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!input.trim() || sending}
              className="bg-primary-700 text-white hover:bg-primary-800 px-3 shrink-0"
              icon={sending ? <CheckCheck className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            >
              {sending ? '' : 'Send'}
            </Button>
          </div>
        </div>
      )}
      </div>{/* end clipped inner wrapper */}
    </motion.div>
  );
}
