'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Clock,
  Users,
  MessageSquare,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  HeadphonesIcon,
  ChevronRight,
  Circle,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import Button from '@/components/Button';
import AgentChatInterface from '@/components/AgentChatInterface';
import logger from '@/lib/logger';

interface QueuedSession {
  id: string;
  userId: string;
  status: 'queued' | 'active' | 'closed';
  reason?: string;
  queuePosition?: number;
  estimatedWaitMs?: number;
  createdAt: string;
  user?: { name?: string; email?: string; avatar?: string };
}

type FilterTab = 'all' | 'queued' | 'active';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

function SessionCard({
  session,
  isActive,
  onAccept,
  onSelect,
  onForceClose,
  accepting,
  index,
}: {
  session: QueuedSession;
  isActive: boolean;
  onAccept: (id: string) => void;
  onSelect: (id: string) => void;
  onForceClose: (id: string) => void;
  accepting: boolean;
  index: number;
}) {
  const customerName =
    session.user?.name ||
    session.user?.email?.split('@')[0] ||
    `User ${session.userId.slice(0, 6)}`;

  const waitMins = session.estimatedWaitMs
    ? Math.ceil(session.estimatedWaitMs / 60000)
    : null;

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };
  const isStale =
    session.status === 'active' &&
    Date.now() - new Date(session.createdAt).getTime() > 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => session.status === 'active' && onSelect(session.id)}
      className={`group relative bg-white rounded-xl border-2 p-4 transition-all duration-200 ${
        isActive
          ? 'border-primary-600 shadow-md shadow-primary-100'
          : session.status === 'active'
          ? 'border-emerald-300 hover:border-emerald-400 hover:shadow-sm cursor-pointer'
          : 'border-gray-200 hover:border-amber-300 hover:shadow-sm'
      }`}
    >
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 bg-primary-600 rounded-l-xl" />
      )}

      <div className="flex items-start gap-3 pl-1">
        {session.user?.avatar ? (
          <div className="shrink-0 relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-slate-200">
            <Image src={session.user.avatar} alt={customerName} fill className="object-cover" />
          </div>
        ) : (
          <div
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
              session.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {customerName[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm truncate">{customerName}</span>
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                session.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {session.status}
            </span>
          </div>

          <p className="text-xs text-gray-500 truncate">
            {session.reason || 'User escalated from Luna assistant'}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <UserCircle2 className="w-3 h-3" />
              {session.userId.slice(0, 8)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTime(session.createdAt)}
            </span>
            {waitMins && session.status === 'queued' && (
              <span className="flex items-center gap-1 text-[11px] text-blue-500">
                <Hourglass className="w-3 h-3" />
                ~{waitMins}m wait
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 ml-1">
          {session.status === 'queued' ? (
            <Button
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onAccept(session.id);
              }}
              disabled={accepting}
              icon={<Phone className="w-3.5 h-3.5" />}
              className="bg-primary-700 hover:bg-primary-800 text-white text-xs px-3"
            >
              Accept
            </Button>
          ) : isStale ? (
            <button
              title="Force close stale session"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onForceClose(session.id);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          ) : (
            <ChevronRight
              className={`w-4 h-4 transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-300 group-hover:text-emerald-500'
              }`}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function LiveChatQueuePage() {
  const [sessions, setSessions] = useState<QueuedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchQueue = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [queueResponse, activeResponse] = await Promise.allSettled([
        apiClient.get<any>('/live-chat/queue'),
        apiClient.get<any>('/live-chat/agent/sessions'),
      ]);

      const queueData: QueuedSession[] = (() => {
        if (queueResponse.status !== 'fulfilled') return [];
        const raw = queueResponse.value?.data;
        const arr = Array.isArray(raw) ? raw : raw?.queue || raw?.sessions || [];
        return arr.map((queue: any) => {
          const s = queue.session || queue;
          return {
            id: s.id || queue.sessionId,
            userId: s.userId,
            status: s.status || 'queued',
            reason: s.reason,
            queuePosition: queue.positionInQueue || queue.queuePosition,
            estimatedWaitMs: queue.estimatedWaitTimeMs || queue.estimatedWaitMs,
            createdAt: s.createdAt,
            user: s.user,
          } as QueuedSession;
        });
      })();

      const activeSessions: QueuedSession[] = (() => {
        if (activeResponse.status !== 'fulfilled') return [];
        const raw = activeResponse.value?.data;
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map((s: any) => ({
          id: s.id,
          userId: s.userId,
          status: 'active' as const,
          reason: s.reason,
          createdAt: s.createdAt,
          user: s.user,
        } as QueuedSession));
      })();

      const seenId = new Set<string>();
      const merged: QueuedSession[] = [];
      for (const s of [...activeSessions, ...queueData]) {
        if (!seenId.has(s.id)) {
          seenId.add(s.id);
          merged.push(s);
        }
      }
      const seenUser = new Map<string, QueuedSession>();
      for (const s of merged) {
        const existing = seenUser.get(s.userId);
        if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
          seenUser.set(s.userId, s);
        }
      }

      const normalized = Array.from(seenUser.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSessions(normalized);
      setLastRefreshed(new Date());
      setActiveChatId((prev) => {
        if (prev) return prev;
        const active = normalized.find((s) => s.status === 'active');
        return active?.id ?? null;
      });
    } catch (err) {
      logger.error('[Admin LiveChat] Error fetching queue:', err);
      setError('Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => void fetchQueue(true), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchQueue]);

  const handleAcceptChat = async (sessionId: string) => {
    try {
      setAccepting(true);
      const response = await apiClient.post<any>('/live-chat/agent/assign', { sessionId });
      if (response?.success) {
        setActiveChatId(sessionId);
        await fetchQueue(true);
      }
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || 'Failed to accept chat');
    } finally {
      setAccepting(false);
    }
  };

  const handleForceClose = async (sessionId: string) => {
    try {
      await apiClient.post<any>(`/live-chat/session/${sessionId}/close`, {});
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeChatId === sessionId) setActiveChatId(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to close session');
    }
  };

  const filtered = sessions.filter((s) => {
    if (filter === 'queued') return s.status === 'queued';
    if (filter === 'active') return s.status === 'active';
    return true;
  });

  const queuedCount = sessions.filter((s) => s.status === 'queued').length;
  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const nonClosedSessions = sessions.filter((s) => s.status !== 'closed');
  const avgWaitMs =
    nonClosedSessions.length > 0
      ? nonClosedSessions.reduce(
          (sum, s) => sum + (Date.now() - new Date(s.createdAt).getTime()),
          0
        ) / nonClosedSessions.length
      : 0;
  const avgWaitLabel = (() => {
    if (nonClosedSessions.length === 0) return '--';
    const mins = Math.ceil(avgWaitMs / 60000);
    if (mins < 1) return '<1m';
    if (mins < 60) return `~${mins}m`;
    return `~${Math.floor(mins / 60)}h ${mins % 60}m`;
  })();

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'queued', label: 'Queued', count: queuedCount },
    { key: 'all', label: 'All', count: sessions.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center">
              <HeadphonesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Chat Queue</h1>
              <p className="text-xs text-gray-500 mt-0.5">Manage incoming customer support requests</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Circle
                className={`w-2 h-2 fill-current ${
                  autoRefresh ? 'text-emerald-500 animate-pulse' : 'text-gray-300'
                }`}
              />
              {autoRefresh ? (
                <span className="text-emerald-600 font-medium">Live</span>
              ) : (
                <span>Paused</span>
              )}
              <span className="text-gray-300 mx-1">·</span>
              <span>
                {lastRefreshed.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh((v) => !v)}
              icon={autoRefresh ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              className="text-sm"
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </Button>

            <Button
              size="sm"
              onClick={() => void fetchQueue()}
              disabled={loading}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              className="bg-primary-700 hover:bg-primary-800 text-white text-sm"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Queue Panel */}
        <div className="xl:col-span-2 space-y-5">

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Queued"
              value={queuedCount}
              icon={Users}
              color="bg-amber-50 text-amber-600"
              delay={0}
            />
            <StatCard
              label="Active"
              value={activeCount}
              icon={Phone}
              color="bg-emerald-50 text-emerald-600"
              delay={0.05}
            />
            <StatCard
              label="Avg Wait"
              value={
                <span className={avgWaitMs ? 'text-blue-700' : 'text-gray-400 text-xl'}>
                  {avgWaitLabel}
                </span>
              }
              icon={Clock}
              color="bg-blue-50 text-blue-600"
              delay={0.1}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-800 flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 text-xs underline shrink-0"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  filter === tab.key
                    ? 'bg-primary-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    filter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Session List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {loading && sessions.length === 0 ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border-2 border-gray-100 p-4 animate-pulse mb-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                          <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                          <div className="h-2 bg-gray-100 rounded w-1/4" />
                        </div>
                        <div className="w-16 h-7 bg-gray-100 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center"
                >
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    {filter === 'all' ? 'No sessions yet' : `No ${filter} sessions`}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {filter === 'all'
                      ? 'Queue will appear here when customers request live chat'
                      : 'Switch to "All" to see other sessions'}
                  </p>
                </motion.div>
              ) : (
                filtered.map((session, i) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isActive={session.id === activeChatId}
                    onAccept={handleAcceptChat}
                    onSelect={setActiveChatId}                    onForceClose={handleForceClose}                    accepting={accepting}
                    index={i}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Tip */}
          {queuedCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Click <strong>Accept</strong> to take a customer from the queue. A live WebSocket
                connection will be established and the conversation will appear on the right.
              </p>
            </motion.div>
          )}
        </div>

        {/* RIGHT: Chat Panel */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <AnimatePresence mode="wait">
              {activeChatId ? (
                <motion.div
                  key={activeChatId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Active Chat
                    </h2>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <Circle className="w-1.5 h-1.5 fill-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <AgentChatInterface
                    sessionId={activeChatId}
                    onClose={() => {
                      setActiveChatId(null);
                      void fetchQueue(true);
                    }}
                    onSessionClosed={(closedId) => {
                      setSessions((prev) => prev.filter((s) => s.id !== closedId));
                      setActiveChatId(null);
                      void fetchQueue(true);
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty-chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center py-16 px-6"
                  style={{ minHeight: '420px' }}
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <HeadphonesIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-semibold mb-1">No Active Chat</p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Accept a chat from the queue
                    <br />
                    to start messaging
                  </p>
                  {activeCount > 0 && (
                    <button
                      onClick={() => {
                        const first = sessions.find((s) => s.status === 'active');
                        if (first) setActiveChatId(first.id);
                      }}
                      className="mt-5 text-sm text-primary-700 hover:text-primary-900 font-medium underline underline-offset-2"
                    >
                      Resume active session
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
