'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useGetAutoRenewalsQuery,
  useEnableAutoRenewalMutation,
  useDisableAutoRenewalMutation,
  useDeleteAutoRenewalMutation,
} from '@/store/slices/autoRenewalSlice';
import {
  AlertCircle,
  RotateCw,
  Calendar,
  Clock,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { SkeletonList } from '@/components/Dashboard/Skeleton';
import { EmptyState } from '@/components/Dashboard/Empty/EmptyState';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function AutoRenewalPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: renewalsData, isLoading, error } = useGetAutoRenewalsQuery({
    page,
    limit,
  });

  const [enableAutoRenewal] = useEnableAutoRenewalMutation();
  const [disableAutoRenewal] = useDisableAutoRenewalMutation();
  const [deleteAutoRenewal] = useDeleteAutoRenewalMutation();

  const renewals = renewalsData?.data || [];
  const pagination = renewalsData?.pagination;

  const handleEnable = async (id: string) => {
    try {
      await enableAutoRenewal(id).unwrap();
    } catch (err) {
      console.error('Failed to enable auto-renewal:', err);
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await disableAutoRenewal(id).unwrap();
    } catch (err) {
      console.error('Failed to disable auto-renewal:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAutoRenewal(id).unwrap();
    } catch (err) {
      console.error('Failed to delete auto-renewal:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-gray-950 mb-2">Auto-Renewal Settings</h1>
          <p className="text-gray-600">
            Automatically renew your eSIMs before they expire
          </p>
        </div>
        <SkeletonList items={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Error Loading Auto-Renewals</h3>
          <p className="text-red-700 text-sm mt-1">
            Failed to load your auto-renewal settings. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (renewals.length === 0) {
    return (
      <EmptyState
        icon={RotateCw}
        title="No Auto-Renewals Set Up"
        description="You haven't set up any auto-renewal subscriptions yet."
        action={{
          label: 'Create Auto-Renewal',
          href: '/dashboard/esims',
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-gray-950 flex items-center gap-3 mb-2">
          <RotateCw className="w-8 h-8 text-primary-700" />
          Auto-Renewal Settings
        </h1>
        <p className="text-gray-600">
          Automatically renew your eSIMs before they expire
        </p>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-primary-700 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-primary-900">Never run out of data</h3>
          <p className="text-sm text-primary-800 mt-1">
            Enable auto-renewal to automatically purchase a new eSIM before your
            current one expires. You'll be charged according to your selected plan.
          </p>
        </div>
      </motion.div>

      {/* Renewals List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {renewals.map((renewal) => (
          <motion.div
            key={renewal.id}
            variants={itemVariants}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    eSIM {renewal.esimId.slice(-8)}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      renewal.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {renewal.enabled ? '✓ Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Renews Before</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {renewal.renewalDaysBefore} days
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 font-medium">Max Renewals</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {renewal.maxAutoRenewals} times
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 font-medium">Used</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {renewal.renewalCount} times
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 font-medium">Payment</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {renewal.autoPayFromWallet ? 'Wallet' : 'Card'}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Next Renewal</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(renewal.nextScheduledRenewal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Last Renewal</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(renewal.lastRenewalAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                {renewal.enabled ? (
                  <button
                    onClick={() => handleDisable(renewal.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Disable auto-renewal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleEnable(renewal.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Enable auto-renewal"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(renewal.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete auto-renewal"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? 'bg-primary-700 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

