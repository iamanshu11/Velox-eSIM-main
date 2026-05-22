'use client';

import React, { useState } from 'react';
import { useGetEmailAnalyticsQuery } from '@/store/slices/autoEmailSlice';

export default function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const { data: analytics, isLoading, error } = useGetEmailAnalyticsQuery({ days });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700 font-medium">Failed to load analytics.</p>
      </div>
    );
  }

  const stats = analytics ?? {
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalUnsubscribed: 0,
    totalBounced: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribeRate: 0,
    bounceRate: 0,
  };

  const metricCards = [
    {
      label: 'Emails Sent',
      value: String(stats.totalSent),
      subtext: 'total delivered',
      accent: 'border-l-gray-900',
    },
    {
      label: 'Open Rate',
      value: `${(stats.openRate ?? 0).toFixed(1)}%`,
      subtext: `${stats.totalOpened} opened`,
      accent: 'border-l-green-600',
    },
    {
      label: 'Click Rate',
      value: `${(stats.clickRate ?? 0).toFixed(1)}%`,
      subtext: `${stats.totalClicked} clicked`,
      accent: 'border-l-blue-600',
    },
    {
      label: 'Unsubscribe Rate',
      value: `${(stats.unsubscribeRate ?? 0).toFixed(1)}%`,
      subtext: `${stats.totalUnsubscribed} unsubscribed`,
      accent: 'border-l-orange-500',
    },
    {
      label: 'Bounce Rate',
      value: `${(stats.bounceRate ?? 0).toFixed(1)}%`,
      subtext: `${stats.totalBounced} bounced`,
      accent: 'border-l-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Period:</label>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={180}>Last 6 months</option>
        </select>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric) => (
          <div
            key={metric.label}
            className={`bg-white border border-neutral-200 rounded-lg p-5 border-l-4 ${metric.accent}`}
          >
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
            <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Summary — Last {days} days</h3>
        <div className="space-y-2.5">
          {[
            ['Total Sent', String(stats.totalSent)],
            ['Opened', `${stats.totalOpened} (${(stats.openRate ?? 0).toFixed(1)}%)`],
            ['Clicked', `${stats.totalClicked} (${(stats.clickRate ?? 0).toFixed(1)}%)`],
            ['Unsubscribed', `${stats.totalUnsubscribed} (${(stats.unsubscribeRate ?? 0).toFixed(1)}%)`],
            ['Bounced', `${stats.totalBounced} (${(stats.bounceRate ?? 0).toFixed(1)}%)`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium text-gray-900">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
