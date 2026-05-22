'use client';

export const dynamic = 'force-dynamic';

import Button from '@/components/Button';
import ActivateESIMModal from '@/components/ActivateESIMModal';
import PageHeader from '@/components/PageHeader';
import { GridSkeleton } from '@/components/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';
import { useGetUserMyESIMsQuery, useCancelUserESIMMutation } from '@/store/slices/esimSlice';
import type { Order } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';
import { AlertCircle, Smartphone, QrCode, Grid3x3, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ESIMsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedESIM, setSelectedESIM] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilterId, setSelectedFilterId] = useState<string>('ALL');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelUserESIM, { isLoading: isCancelling }] = useCancelUserESIMMutation();
  const { data: esimData, isLoading, error } = useGetUserMyESIMsQuery(
    { page: 1, limit: 100 }
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?from=/dashboard/esims');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const esims = Array.isArray(esimData?.esims) ? esimData.esims : [];

  const isActiveOrReady = (esim: Order) => {
    const status = esim.status?.toUpperCase();
    const esimStatus = esim.esimStatus?.toUpperCase();

    if (status === 'ACTIVE' || status === 'READY') {
      return true;
    }

    return esimStatus === 'IN_USE' || esimStatus === 'GOT_RESOURCE';
  };

  const actionableESIMs = esims.filter(isActiveOrReady);

  const dropdownOptions = actionableESIMs.map((esim) => {
    const filterId = esim.id || esim.esimTranNo || esim.orderNo;
    const displayName = esim.plan?.name || 'eSIM Plan';
    const orderRef = esim.orderNo || esim.esimTranNo || esim.id;

    return {
      id: filterId,
      label: `${displayName} (${orderRef})`,
    };
  });

  const selectedESIMs =
    selectedFilterId === 'ALL'
      ? actionableESIMs
      : actionableESIMs.filter((esim) => (esim.id || esim.esimTranNo || esim.orderNo) === selectedFilterId);

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'EXPIRED':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-600';
      case 'EXPIRED':
        return 'bg-orange-600';
      case 'CANCELLED':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const clampPercent = (value?: number) => Math.max(0, Math.min(100, value ?? 0));

  const openModal = (esim: Order) => {
    setSelectedESIM(esim);
    setModalOpen(true);
  };

  const handleCancelESIM = async (esim: Order) => {
    const tranNo = esim.esimTranNo;
    if (!tranNo) return;
    if (confirmCancelId !== tranNo) {
      setConfirmCancelId(tranNo);
      return;
    }
    try {
      await cancelUserESIM(tranNo).unwrap();
      setConfirmCancelId(null);
    } catch {
      setConfirmCancelId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        subtitle="My eSIMs"
        title="Your connected eSIM plans"
        description="Track plan status, usage, and renewals in one polished dashboard."
      />

      {/* Loading State */}
      {isLoading && <GridSkeleton />}

      {/* Error State */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error loading eSIMs</h3>
            <p className="text-sm text-red-700 mt-1">{getErrorMessage(error)}</p>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && actionableESIMs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gray-200 bg-linear-to-br from-gray-50 to-gray-100 p-12 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary-100 p-3">
              <Smartphone className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active or Ready eSIMs</h3>
          <p className="text-sm text-gray-600 mb-6">Only active plans and plans that need activation are shown here.</p>
          <Link href="/esims">
            <Button className="bg-primary-700 text-white hover:bg-primary-800">
              Browse Plans
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Content Loaded */}
      {!isLoading && !error && actionableESIMs.length > 0 && (
        <>
          {/* View Toggle & Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-950">Your eSIM Plans</h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedFilterId}
                onChange={(e) => setSelectedFilterId(e.target.value)}
                className="h-11 min-w-55 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm focus:border-primary-600 focus:outline-none"
              >
                <option value="ALL">All Purchased eSIMs</option>
                {dropdownOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-700 shadow-sm border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-700 shadow-sm border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {selectedESIMs.map((esim: Order, idx: number) => (
                <motion.div
                  key={esim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-gray-200 bg-white hover:shadow-xl hover:border-primary-300 transition-all duration-300 overflow-hidden group"
                >
                  {/* Content */}
                  <div className="relative p-6 space-y-6">
                    {/* Header with Status Badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">eSIM Plan</p>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {esim.plan?.name || 'Velox eSIM'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {esim.plan?.countryCode}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusBadgeColor(esim.status)}`}>
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(esim.status)}`} />
                        {esim.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Data */}
                      <div className="bg-linear-to-br from-primary-50 to-primary-100/50 rounded-xl p-3 border border-primary-200/50">
                        <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-2">Data</p>
                        <p className="text-lg font-bold text-primary-900">
                          {formatBytes(esim.totalVolume || 0)}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="bg-linear-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-200/50">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Validity</p>
                        <p className="text-lg font-bold text-amber-900">
                          {esim.totalDuration || 0}d
                        </p>
                      </div>

                      {/* Expires */}
                      <div className="bg-linear-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-200/50">
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">Expires</p>
                        <p className="text-lg font-bold text-purple-900">
                          {esim.expiresAt ? new Date(esim.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Data Usage Bar */}
                    {esim.dataUsagePercent !== undefined && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Usage</p>
                          <p className="text-xs font-bold text-gray-700">{clampPercent(esim.dataUsagePercent)}%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${clampPercent(esim.dataUsagePercent)}%` }}
                            transition={{ duration: 1, delay: idx * 0.05 + 0.2 }}
                            className={`h-full transition-all ${
                              clampPercent(esim.dataUsagePercent) > 80 ? 'bg-red-500' :
                              clampPercent(esim.dataUsagePercent) > 50 ? 'bg-amber-500' :
                              'bg-green-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />

                  {/* Actions Footer */}
                  {!['CANCELLED', 'EXPIRED'].includes(esim.status?.toUpperCase() ?? '') && (
                    <div className="relative px-6 py-4 bg-linear-to-b from-white to-gray-50 space-y-2">
                      {esim.status?.toUpperCase() === 'READY' && (
                        <button
                          onClick={() => openModal(esim)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
                        >
                          <QrCode className="w-4 h-4" />
                          Activate
                        </button>
                      )}
                      {esim.esimTranNo && (
                        confirmCancelId === esim.esimTranNo ? (
                          <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                            <p className="text-xs font-medium text-red-700">Cancel this eSIM?</p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                Keep
                              </button>
                              <button
                                onClick={() => handleCancelESIM(esim)}
                                disabled={isCancelling}
                                className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                              >
                                {isCancelling ? 'Cancelling...' : 'Yes, cancel'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCancelESIM(esim)}
                            className="w-full text-xs font-medium text-gray-400 hover:text-red-500 transition-colors py-0.5"
                          >
                            Cancel plan
                          </button>
                        )
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {selectedESIMs.map((esim: Order, idx: number) => (
                <motion.div
                  key={esim.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Plan Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">
                        {esim.plan?.name || 'Velox eSIM'}
                      </h3>
                      <p className="text-sm text-gray-600">{esim.plan?.countryCode}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden lg:flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Data</p>
                        <p className="text-lg font-bold text-gray-900">{formatBytes(esim.totalVolume || 0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Validity</p>
                        <p className="text-lg font-bold text-gray-900">{esim.totalDuration}d</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Expires</p>
                        <p className="text-lg font-bold text-gray-900">
                          {esim.expiresAt ? new Date(esim.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusBadgeColor(esim.status)}`}>
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(esim.status)}`} />
                        {esim.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Mobile: Status Badge */}
                    <div className="lg:hidden flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(esim.status)}`}>
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(esim.status)}`} />
                        {esim.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {esim.status?.toUpperCase() === 'READY' && (
                        <button
                          onClick={() => openModal(esim)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Activate
                        </button>
                      )}
                      {!['CANCELLED', 'EXPIRED'].includes(esim.status?.toUpperCase() ?? '') && esim.esimTranNo && (
                        confirmCancelId === esim.esimTranNo ? (
                          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5">
                            <p className="text-xs font-medium text-red-700">Cancel?</p>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Keep
                            </button>
                            <button
                              onClick={() => handleCancelESIM(esim)}
                              disabled={isCancelling}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                            >
                              {isCancelling ? '...' : 'Yes'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCancelESIM(esim)}
                            className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Cancel plan
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Mobile: Extra Info */}
                  {esim.dataUsagePercent !== undefined && (
                    <div className="lg:hidden mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-600">Usage</p>
                        <p className="text-xs font-bold text-gray-700">{clampPercent(esim.dataUsagePercent)}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            clampPercent(esim.dataUsagePercent) > 80 ? 'bg-red-500' :
                            clampPercent(esim.dataUsagePercent) > 50 ? 'bg-amber-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${clampPercent(esim.dataUsagePercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* Modal */}
      {selectedESIM && (
        <ActivateESIMModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedESIM(null);
          }}
          order={selectedESIM}
        />
      )}
    </div>
  );
}
