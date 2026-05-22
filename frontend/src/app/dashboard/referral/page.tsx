'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, Users, TrendingUp, Gift, AlertCircle, Plus, ChevronDown } from 'lucide-react';
import { useGetReferralStatsQuery, useGetMyReferralCodesQuery, useCreateReferralCodeMutation } from '@/store/slices/referralSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Button from '@/components/Button';

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

interface ExpandedCodes {
  [key: string]: boolean;
}

export default function ReferralPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCodes, setExpandedCodes] = useState<ExpandedCodes>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ discount: 20, maxUses: undefined as number | undefined, expiresAt: '' });

  const { data: statsData, isLoading: statsLoading, error: statsError } = useGetReferralStatsQuery();
  const { data: codesData, isLoading: codesLoading, error: codesError } = useGetMyReferralCodesQuery({
    page: currentPage,
    limit: 10,
  });
  const [createCode, { isLoading: isCreating }] = useCreateReferralCodeMutation();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCode = async () => {
    try {
      await createCode({
        discount: formData.discount,
        maxUses: formData.maxUses,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      }).unwrap();
      setShowCreateForm(false);
      setFormData({ discount: 20, maxUses: undefined, expiresAt: '' });
    } catch (error) {
      console.error('Failed to create referral code:', error);
    }
  };

  const toggleExpanded = (codeId: string) => {
    setExpandedCodes(prev => ({
      ...prev,
      [codeId]: !prev[codeId]
    }));
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-700' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    };
    const badgeConfig = config[status as keyof typeof config] || config.inactive;
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badgeConfig.bg} ${badgeConfig.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-black text-gray-950">Referral Program</h1>
        <p className="text-gray-600 mt-2">Earn rewards by referring friends to eSIM Global</p>
      </motion.div>

      {/* Stats Cards */}
      {!statsLoading && !statsError && statsData && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Referrals</p>
                <p className="text-3xl font-bold text-primary-700 mt-2">{statsData.totalReferrals}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Users className="w-5 h-5 text-primary-700" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">All time</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Referrals</p>
                <p className="text-3xl font-bold text-primary-700 mt-2">{statsData.activeReferrals}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary-700" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Currently active</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(statsData.totalEarnings)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Credited to account</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Earnings</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{formatCurrency(statsData.pendingEarnings)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Share2 className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Awaiting confirmation</p>
          </motion.div>
        </motion.div>
      )}

      {/* Loading State for Stats */}
      {statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State for Stats */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Failed to load statistics</h3>
            <p className="text-red-700 text-sm mt-1">Please try refreshing the page</p>
          </div>
        </div>
      )}

      {/* Referral Codes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Referral Codes</h2>
            <p className="text-gray-600 text-sm mt-1">Create and manage your referral codes</p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            Create Code
          </Button>
        </div>

        {/* Create Code Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-br from-primary-50 to-indigo-50 border border-primary-200 rounded-xl p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Create New Referral Code</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Uses (Optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  isFullWidth
                  isLoading={isCreating}
                  onClick={handleCreateCode}
                >
                  Create Code
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  isFullWidth
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {codesLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {codesError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Failed to load referral codes</h3>
              <p className="text-red-700 text-sm mt-1">There was an error fetching your codes</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!codesLoading && !codesError && codesData?.data.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No referral codes yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first referral code to start earning</p>
          </div>
        )}

        {/* Codes List */}
        {!codesLoading && !codesError && codesData?.data && codesData.data.length > 0 && (
          <div className="space-y-4">
            {codesData.data.map((code, index) => (
              <motion.div
                key={code.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-neutral-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all"
              >
                {/* Code Header */}
                <button
                  onClick={() => toggleExpanded(code.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-2.5 bg-purple-50 rounded-lg">
                        <Copy className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{code.code}</h3>
                        <p className="text-sm text-gray-500">{code.discount}% discount</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-12">
                      <div>
                        <p className="text-sm text-gray-600">Used</p>
                        <p className="font-bold text-gray-900">{code.usedCount}/{code.maxUses || '∞'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="mt-1">{getStatusBadge(code.active ? 'active' : 'inactive')}</div>
                      </div>
                      {code.expiresAt && (
                        <div>
                          <p className="text-sm text-gray-600">Expires</p>
                          <p className="font-medium text-gray-900">{formatDate(code.expiresAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedCodes[code.id] ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>

                {/* Code Details */}
                {expandedCodes[code.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-neutral-200 bg-gray-50 p-6"
                  >
                    <div className="space-y-4">
                      {/* Copy Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Copy Code</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={code.code}
                            readOnly
                            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg font-mono font-semibold text-gray-900"
                          />
                          <button
                            onClick={() => handleCopyCode(code.code)}
                            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Share Referral Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${code.code}`}
                            readOnly
                            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 truncate"
                          />
                          <button
                            onClick={() => handleCopyCode(`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${code.code}`)}
                            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                          >
                            {copiedCode?.includes(code.code) ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="bg-white border border-neutral-100 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Created</span>
                          <span className="font-semibold text-gray-900">{formatDate(code.createdAt)}</span>
                        </div>
                        {code.expiresAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Expires</span>
                            <span className="font-semibold text-gray-900">{formatDate(code.expiresAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                          <span className="text-gray-600">Usage</span>
                          <span className="font-semibold text-gray-900">{code.usedCount} / {code.maxUses || 'Unlimited'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!codesLoading && codesData?.pagination && codesData.pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!codesData.pagination.hasPrevPage}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: codesData.pagination.totalPages }, (_, i) => i + 1).map(page => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                    currentPage === page
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!codesData.pagination.hasNextPage}
            >
              Next
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-linear-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-200 p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-primary-700">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Share Your Code</h3>
            <p className="text-sm text-gray-600">Share your referral code with friends</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-primary-700">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Friend Signs Up</h3>
            <p className="text-sm text-gray-600">They create an account with your code</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-primary-700">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Earn Rewards</h3>
            <p className="text-sm text-gray-600">Get rewards for each referral</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

