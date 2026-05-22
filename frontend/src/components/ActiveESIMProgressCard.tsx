'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Zap, Globe, BarChart3, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { COUNTRY_CODE_TO_NAME } from '@/lib/countryMap';

interface ActiveESIMProgressCardProps {
  id: string;
  orderNo: string;
  iccid?: string;
  status: string;
  totalVolume?: number;
  dataUsage?: number;
  dataUsagePercent?: number;
  remainingVolume?: number;
  totalDuration?: number;
  durationUnit?: string;
  activatedAt?: string;
  expiresAt?: string;
  daysUntilExpiry?: number;
  plan?: { name: string; countryCode?: string };
  packages?: Array<{ location?: string; name?: string }>;
  index?: number;
}
export default function ActiveESIMProgressCard({
  id,
  orderNo,
  iccid,
  dataUsagePercent = 0,
  remainingVolume = 0,
  totalVolume = 0,
  daysUntilExpiry = 0,
  activatedAt,
  expiresAt,
  plan,
  packages,
  index = 0,
}: ActiveESIMProgressCardProps) {
  const locationCode = packages?.[0]?.location || plan?.countryCode;
  const countryName = locationCode
    ? COUNTRY_CODE_TO_NAME[locationCode.toUpperCase()] ?? locationCode
    : 'Global';

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';

    const thresholds = [
      { label: 'TB', value: 1024 ** 4 },
      { label: 'GB', value: 1024 ** 3 },
      { label: 'MB', value: 1024 ** 2 },
      { label: 'KB', value: 1024 },
    ];

    for (const threshold of thresholds) {
      if (bytes >= threshold.value) {
        const size = bytes / threshold.value;
        const precision = threshold.label === 'MB' ? 0 : 1;
        return `${size.toFixed(precision)} ${threshold.label}`;
      }
    }

    return `${bytes} B`;
  };

  const formatRemainingPercent = (percent: number): string => {
    const remainingPercent = Math.max(0, 100 - percent);
    return `${Math.round(remainingPercent)}%`;
  };

  const formatTimeLeft = (): string => {
    if (!expiresAt) {
      if (daysUntilExpiry <= 0) return 'Expired';
      if (daysUntilExpiry === 1) return '1 day';
      return `${daysUntilExpiry} days`;
    }

    const expiresAtDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiresAtDate.getTime() - now.getTime();

    if (!Number.isFinite(diffMs) || diffMs <= 0) {
      return 'Expired';
    }

    const totalMinutes = Math.max(1, Math.round(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 24) {
      const days = Math.round(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };
  const getExpiryColor = (): string => {
    if (daysUntilExpiry <= 0) return 'text-red-600';
    if (daysUntilExpiry <= 3) return 'text-orange-600';
    if (daysUntilExpiry <= 7) return 'text-amber-600';
    return 'text-green-600';
  };

  const getProgressBarColor = (): string => {
    if (dataUsagePercent >= 90) return 'bg-red-500';
    if (dataUsagePercent >= 75) return 'bg-orange-500';
    if (dataUsagePercent >= 50) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const displayDataUsagePercent = Math.max(0, Math.min(100, dataUsagePercent));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
    >
      {/* Header: Country & Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{countryName}</p>
            <p className="text-xs text-gray-500">{orderNo}</p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-green-100 rounded-full">
          <p className="text-xs font-semibold text-green-700">Active</p>
        </div>
      </div>

      {/* Data Left */}
      {totalVolume > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-semibold text-gray-700">Data left</p>
            </div>
            <p className="text-xs font-semibold text-gray-600">
              {formatBytes(remainingVolume || 0)} {formatRemainingPercent(dataUsagePercent)}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${displayDataUsagePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${getProgressBarColor()} transition-colors`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {displayDataUsagePercent.toFixed(1)}% used • {formatBytes(remainingVolume || 0)} remaining
          </p>
        </div>
      )}

      {/* Timeline: Activation & Expiry */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Activated */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-green-600" />
            <p className="text-xs font-semibold text-gray-700">Activated</p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{formatDate(activatedAt)}</p>
        </div>

        {/* Expires */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            <p className="text-xs font-semibold text-gray-700">Time left</p>
          </div>
          <p className={`text-sm font-semibold ${getExpiryColor()}`}>
            {formatTimeLeft()}
          </p>
        </div>
      </div>

      {/* Expiry Warning */}
      {daysUntilExpiry <= 3 && daysUntilExpiry > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-700">
            Your eSIM expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. Consider purchasing an extension.
          </p>
        </div>
      )}

      {/* Expired Warning */}
      {daysUntilExpiry <= 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">
            Your eSIM has expired. <Link href="/esim" className="font-semibold underline">Get a new plan</Link>.
          </p>
        </div>
      )}

      {/* Footer: Tech Details & Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {iccid && <span title="ICCID">{iccid.slice(-4)}</span>}
        </div>
        <Link
          href={`/dashboard/esims?esim=${id}`}
          className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors"
        >
          View Details →
        </Link>
      </div>
    </motion.div>
  );
}
