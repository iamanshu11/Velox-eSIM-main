'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Zap, ChevronRight, Loader } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';

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

interface ExpiringESIM {
  id: string;
  iccid: string;
  orderNo: string;
  status: string;
  totalVolume?: number;
  expiredTime: string;
  daysRemaining: number;
  isUrgent: boolean;
  packages?: any;
  totalPrice: number;
  selected?: boolean;
}

export default function BulkRenewPage() {
  const [esims, setEsims] = useState<ExpiringESIM[]>([]);
  const [selectedMap, setSelectedMap] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [renewalSummary, setRenewalSummary] = useState<any>(null);
  useEffect(() => {
    const fetchExpiringESIMs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<any>('/orders/dashboard/expiring-esims?days=30');
        
        if (response && response.data) {
          const data = Array.isArray(response.data) ? response.data : response.data.data || [];
          setEsims(data);
          
          const map = new Map<string, boolean>();
          data.forEach((esim: ExpiringESIM) => {
            map.set(esim.id, false);
          });
          setSelectedMap(map);
        }
      } catch (err) {
        logger.error('Failed to fetch expiring eSIMs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load eSIMs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpiringESIMs();
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, !newMap.get(id));
      return newMap;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    const filteredIds = filteredEsims.map(e => e.id);
    const allSelected = filteredIds.every(id => selectedMap.get(id));
    
    setSelectedMap((prev) => {
      const newMap = new Map(prev);
      filteredIds.forEach(id => {
        newMap.set(id, !allSelected);
      });
      return newMap;
    });
  }, [selectedMap, esims, filterUrgent]);

  const filteredEsims = filterUrgent
    ? esims.filter((e) => e.isUrgent)
    : esims;

  const selectedEsims = esims.filter((e) => selectedMap.get(e.id));
  const selectedCount = selectedEsims.length;
  const totalPrice = selectedEsims.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
  const allSelectedChecked = filteredEsims.length > 0 && filteredEsims.every((e) => selectedMap.get(e.id));

  const handleProceedCheckout = async () => {
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      const renewalRequest = {
        eSIMs: selectedEsims.map((esim) => ({
          id: esim.id,
          orderNo: esim.orderNo,
          iccid: esim.iccid,
          currentPrice: esim.totalPrice,
        })),
      };
      const response = await apiClient.post<any>('/orders/bulk-renew', renewalRequest);

      if (response && response.data) {
        setRenewalSummary(response.data);
        setShowCheckout(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate renewal';
      logger.error('Checkout error:', err);
      setCheckoutError(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSelectPlan = () => {
    logger.debug('Select plan for renewal');
  };

  const handleProceedToPayment = async () => {
    if (!renewalSummary) return;

    const totalCost: number = renewalSummary.totalCost || totalPrice;

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      const walletRes = await apiClient.get<any>('/wallet/balance');
      const balance: number = walletRes?.data?.balance || 0;

      if (balance < totalCost) {
        const needed = (totalCost - balance).toFixed(2);
        setCheckoutError(
          `Insufficient wallet balance. You need $${needed} more. Please top up your wallet first.`
        );
        return;
      }

      const intentRes = await apiClient.post<any>('/payments/purchase/intent', {
        amount: totalCost,
        packageCode: `bulk-renew-${renewalSummary.id || Date.now()}`,
        quantity: renewalSummary.totalESIMs || selectedCount,
      });

      if (intentRes?.data?.paymentIntentId) {
        const confirmRes = await apiClient.post<any>('/payments/topup/confirm', {
          paymentIntentId: intentRes.data.paymentIntentId,
        });

        if (confirmRes?.data?.status === 'success') {
          setShowCheckout(false);
          alert(`Bulk renewal payment of $${totalCost.toFixed(2)} processed successfully from your wallet.`);
        }
      } else {
        window.location.href = `/dashboard/wallet/topup?amount=${totalCost.toFixed(2)}&returnTo=/dashboard/bulk-renew`;
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to process payment';
      logger.error('Payment error:', err);
      setCheckoutError(message);
    } finally {
      setCheckoutLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-primary-700" />
            Bulk Renew eSIMs
          </h1>
        </motion.div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="w-12 h-12 text-primary-700 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Loading your eSIMs...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-primary-700" />
            Bulk Renew eSIMs
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4"
        >
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">Failed to Load eSIMs</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  if (esims.length === 0) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-primary-700" />
            Bulk Renew eSIMs
          </h1>
          <p className="text-gray-600">Select multiple eSIMs and renew them all at once.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-primary-50 rounded-lg border border-primary-200"
        >
          <CheckCircle2 className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <p className="text-primary-900 font-bold text-xl mb-2">All eSIMs Active!</p>
          <p className="text-primary-700 mb-4">You don't have any eSIMs expiring in the next 30 days.</p>
          <p className="text-primary-600 text-sm">Once an eSIM is about to expire, it will appear here for easy renewal.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black text-gray-950 flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-primary-700" />
          Bulk Renew eSIMs
        </h1>
        <p className="text-gray-600">Select multiple eSIMs and renew them all at once. Save time and money with bulk renewals.</p>
      </motion.div>

      {/* Filter & Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filterUrgent}
            onChange={(e) => setFilterUrgent(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Show only expiring soon (≤ 7 days)</span>
        </label>

        <div className="text-sm font-semibold text-gray-600">
          {filteredEsims.length} {filteredEsims.length === 1 ? 'eSIM' : 'eSIMs'} expiring soon
        </div>
      </motion.div>

      {/* Info Banner */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-primary-900">
              {selectedCount} {selectedCount === 1 ? 'eSIM selected' : 'eSIMs selected'}
            </p>
            <p className="text-sm text-primary-700 mt-1">
              You'll save time by renewing everything at once!
            </p>
          </div>
        </motion.div>
      )}

      {/* eSIMs List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Select All */}
        <motion.div
          variants={itemVariants}
          className="bg-gray-50 rounded-lg border border-gray-200 p-4"
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelectedChecked}
              onChange={toggleAllSelection}
              className="w-4 h-4 rounded"
            />
            <span className="font-semibold text-gray-900">
              {allSelectedChecked ? 'Deselect All' : 'Select All'} ({filteredEsims.length})
            </span>
          </label>
        </motion.div>

        {/* eSIM Cards - Real Data from API */}
        <AnimatePresence>
          {filteredEsims.map((esim) => {
            const isSelected = selectedMap.get(esim.id) || false;

            return (
              <motion.div
                key={esim.id}
                variants={itemVariants}
                exit={{ opacity: 0, y: -20 }}
                className={`border rounded-lg p-6 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : `border-gray-200 bg-white hover:border-gray-300 ${
                        esim.isUrgent ? 'border-red-200 bg-red-50' : ''
                      }`
                }`}
                onClick={() => toggleSelection(esim.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(esim.id)}
                    className="w-5 h-5 rounded mt-1 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{esim.iccid}</p>
                        <p className="text-sm text-gray-600">Order: {esim.orderNo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {esim.isUrgent && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Urgent
                          </span>
                        )}
                        {!esim.isUrgent && esim.daysRemaining <= 14 && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                            {esim.daysRemaining} days left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">DATA</p>
                        <p className="font-semibold text-gray-900">
                          {esim.totalVolume ? `${esim.totalVolume} GB` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">STATUS</p>
                        <p className="font-semibold text-gray-900 capitalize">{esim.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">RENEWAL PRICE</p>
                        <p className="font-semibold text-gray-900">${(esim.totalPrice || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-semibold mb-1">DAYS LEFT</p>
                        <p
                          className={`font-bold text-lg ${
                            esim.isUrgent ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {esim.daysRemaining}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((esim.daysRemaining / 30) * 100, 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full ${
                            esim.isUrgent
                              ? 'bg-red-500'
                              : esim.daysRemaining <= 14
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-semibold">
                        {Math.min(Math.round((esim.daysRemaining / 30) * 100), 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEsims.length === 0 && !filterUrgent && (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200"
          >
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold mb-2">No expiring eSIMs</p>
            <p className="text-gray-500 text-sm">All your eSIMs are active with good data remaining</p>
          </motion.div>
        )}
      </motion.div>

      {/* Summary & Checkout */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-6 bg-white border border-gray-200 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total for {selectedCount} renewal(s):</p>
                <p className="text-4xl font-bold text-gray-900">${totalPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Average: ${(totalPrice / selectedCount).toFixed(2)} per eSIM
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectPlan}
                  disabled={checkoutLoading}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Change Plans
                </button>
                <button
                  onClick={handleProceedCheckout}
                  disabled={checkoutLoading}
                  className="px-8 py-3 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      {showCheckout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !checkoutLoading && setShowCheckout(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Error State */}
            {checkoutError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">Checkout Failed</p>
                  <p className="text-red-700 text-sm">{checkoutError}</p>
                </div>
              </motion.div>
            )}

            <h2 className="text-2xl font-black text-gray-950 mb-6 flex items-center gap-2">
              {renewalSummary ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Renewal Initiated
                </>
              ) : (
                "Checkout Summary"
              )}
            </h2>
            
            {renewalSummary ? (
              <div className="space-y-6 mb-8">
                {/* Summary Card */}
                <div className="bg-linear-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-primary-800 mb-2">eSIMs Renewing</p>
                      <p className="text-3xl font-bold text-primary-900">{renewalSummary.totalESIMs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-800 mb-2">Total Cost</p>
                      <p className="text-3xl font-bold text-primary-900">${renewalSummary.totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-800 mb-2">Status</p>
                      <p className="text-lg font-bold text-primary-900 capitalize">{renewalSummary.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* eSIMs List */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-3">Renewals Scheduled:</p>
                  <div className="space-y-2">
                    {renewalSummary.eSIMsToRenew.map((esim: any) => (
                      <div key={esim.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                        <div>
                          <p className="font-medium text-gray-900">{esim.iccid}</p>
                          <p className="text-xs text-gray-600">Order: {esim.orderNo}</p>
                        </div>
                        <p className="font-bold text-gray-900">${esim.renewalPrice.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    <span className="font-semibold">Next Step:</span> Click "Proceed to Payment" to complete your renewal. Your renewal will be processed within 24 hours.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <p className="text-gray-600">
                  You're about to renew <span className="font-bold">{selectedCount}</span> eSIMs for a total of <span className="font-bold">${totalPrice.toFixed(2)}</span>
                </p>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <p className="text-sm text-primary-900">
                    <span className="font-semibold">Initiating renewal...</span> Please wait while we prepare your renewal request.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowCheckout(false)}
                disabled={checkoutLoading}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {renewalSummary ? "Close" : "Cancel"}
              </button>
              {renewalSummary && (
                <button
                  onClick={handleProceedToPayment}
                  disabled={checkoutLoading}
                  className="flex-1 px-6 py-3 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Proceed to Payment
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

