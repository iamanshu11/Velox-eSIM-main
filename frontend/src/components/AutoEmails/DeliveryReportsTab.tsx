'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetDeliveryReportsQuery, useListTemplatesQuery } from '@/store/slices/autoEmailSlice';

export default function DeliveryReportsTab() {
  const [page, setPage] = useState(1);
  const [templateId, setTemplateId] = useState('');
  const limit = 20;

  const { data, isLoading, error } = useGetDeliveryReportsQuery({
    page,
    limit,
    templateId: templateId || undefined,
  });
  const { data: templates } = useListTemplatesQuery({});

  const logs: any[] = data?.logs ?? [];
  const pagination = data?.pagination;

  const getStatusBadge = (log: any) => {
    if (log.bounced) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          Bounced
        </span>
      );
    }
    if (log.unsubscribedAt) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Unsubscribed
        </span>
      );
    }
    if (log.clickedAt) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
          Clicked
        </span>
      );
    }
    if (log.openedAt) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          Opened
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-gray-600 border border-neutral-200">
        Delivered
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={templateId}
          onChange={(e) => { setTemplateId(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All templates</option>
          {(templates ?? []).map((t: any) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        {pagination && (
          <p className="text-sm text-gray-500 ml-auto">
            {pagination.total} record{pagination.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium">Failed to load delivery reports.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Recipient
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Template
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Sent At
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">
                      No delivery records found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{log.user?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{log.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.template?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(log)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-neutral-200 rounded-md disabled:opacity-40 hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="p-1.5 border border-neutral-200 rounded-md disabled:opacity-40 hover:bg-neutral-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}