'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Loader, RefreshCw, XCircle, Zap } from 'lucide-react';
import {
  useGetScheduleProgressQuery,
  useScheduleEmailsMutation,
  useClassifyUsersMutation,
  useProcessEmailsNowMutation,
  useListEmailSchedulesQuery,
  useCancelEmailScheduleMutation,
} from '@/store/slices/autoEmailSlice';

type StatusFilter = 'all' | 'pending' | 'sent' | 'failed' | 'cancelled';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'failed', label: 'Failed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  sent: { label: 'Sent', className: 'bg-green-50 text-green-700 border-green-200' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-100 text-gray-600 border-neutral-200' },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ScheduleTab() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: progress, isLoading: loadingStats, refetch: refetchStats } = useGetScheduleProgressQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: schedulesData, isLoading: loadingSchedules, refetch: refetchSchedules } = useListEmailSchedulesQuery({
    page: currentPage,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const [scheduleEmails, { isLoading: isScheduling }] = useScheduleEmailsMutation();
  const [classifyUsers, { isLoading: isClassifying }] = useClassifyUsersMutation();
  const [processEmailsNow, { isLoading: isProcessing }] = useProcessEmailsNowMutation();
  const [cancelEmailSchedule] = useCancelEmailScheduleMutation();

  const refetchAll = () => { refetchStats(); refetchSchedules(); };

  const handleScheduleEmails = async () => {
    try { await scheduleEmails().unwrap(); refetchAll(); } catch { /* handled */ }
  };
  const handleClassifyUsers = async () => {
    try { await classifyUsers().unwrap(); } catch { /* handled */ }
  };
  const handleProcessNow = async () => {
    try { await processEmailsNow().unwrap(); refetchAll(); } catch { /* handled */ }
  };
  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try { await cancelEmailSchedule(id).unwrap(); } catch { /* handled */ }
    finally { setCancellingId(null); }
  };

  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  if (loadingStats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = progress ?? { total: 0, pending: 0, sent: 0, failed: 0, cancelled: 0 };
  const schedules: any[] = schedulesData?.schedules ?? [];
  const pagination = schedulesData?.pagination ?? { total: 0, pages: 1 };

  const statCards = [
    { label: 'Total', value: stats.total, icon: Clock, accent: 'border-l-gray-900' },
    { label: 'Pending', value: stats.pending, icon: AlertCircle, accent: 'border-l-amber-500' },
    { label: 'Sent', value: stats.sent, icon: CheckCircle, accent: 'border-l-green-600' },
    { label: 'Failed', value: stats.failed, icon: XCircle, accent: 'border-l-red-500' },
  ];

  const isAnyLoading = isScheduling || isClassifying || isProcessing;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleClassifyUsers}
          disabled={isAnyLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Analyze user activity and assign email segments"
        >
          {isClassifying && <Loader className="w-4 h-4 animate-spin" />}
          Classify Users
        </button>
        <button
          onClick={handleScheduleEmails}
          disabled={isAnyLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Queue new emails for users based on their segments"
        >
          {isScheduling && <Loader className="w-4 h-4 animate-spin" />}
          Schedule Emails
        </button>
        <button
          onClick={handleProcessNow}
          disabled={isAnyLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
          title="Process and send all pending scheduled emails immediately"
        >
          {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Process Now
        </button>
        <button
          onClick={refetchAll}
          disabled={isAnyLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-white border border-neutral-200 rounded-lg p-5 border-l-4 ${stat.accent}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule list */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {/* Status filter tabs */}
        <div className="flex items-center gap-0 border-b border-neutral-200 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadingSchedules ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No scheduled emails found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Template</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Scheduled For</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {schedules.map((schedule: any) => {
                    const badge = STATUS_BADGE[schedule.status] ?? { label: schedule.status, className: 'bg-neutral-100 text-gray-600 border-neutral-200' };
                    return (
                      <tr key={schedule.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-35">{schedule.user?.name ?? '—'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-35">{schedule.user?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700 truncate max-w-40">{schedule.template?.title ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                          {formatDate(schedule.scheduledFor)}
                        </td>
                        <td className="px-4 py-3">
                          {schedule.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(schedule.id)}
                              disabled={cancellingId === schedule.id}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === schedule.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <p className="text-xs text-gray-500">
                  Page {currentPage} of {pagination.pages} — {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={currentPage >= pagination.pages}
                    className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
