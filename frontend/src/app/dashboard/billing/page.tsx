'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import { useGetBillingStatsQuery, useGetBillingStatementsQuery } from '@/store/slices/billingSlice';
import { billingService } from '@/services/billingService';
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

interface ExpandedStatements {
  [key: string]: boolean;
}

export default function BillingPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedStatements, setExpandedStatements] = useState<ExpandedStatements>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: statsData, isLoading: statsLoading, error: statsError } = useGetBillingStatsQuery();
  const { data: statementsData, isLoading: statementsLoading, error: statementsError } = useGetBillingStatementsQuery({
    page: currentPage,
    limit: 10,
  });

  const handleDownload = async (statementId: string) => {
    try {
      setDownloadingId(statementId);
      const blob = await billingService.downloadInvoice(statementId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement-${statementId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleExpanded = (statementId: string) => {
    setExpandedStatements(prev => ({
      ...prev,
      [statementId]: !prev[statementId]
    }));
  };

  const getStatusBadge = (status: string) => {
    const config = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    };
    const badgeConfig = config[status as keyof typeof config] || config.pending;
    const StatusIcon = badgeConfig.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeConfig.bg} ${badgeConfig.text}`}>
        <StatusIcon className="w-3 h-3" />
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
        <h1 className="text-4xl font-black text-gray-950">Billing & Statements</h1>
        <p className="text-gray-600 mt-2">View and manage your billing statements and invoices</p>
      </motion.div>

      {/* Stats Cards */}
      {!statsLoading && !statsError && statsData && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Billed</p>
                <p className="text-3xl font-bold text-primary-700 mt-2">{formatCurrency(statsData.totalBilled)}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary-700" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Average Monthly</p>
                <p className="text-3xl font-bold text-primary-700 mt-2">{formatCurrency(statsData.averageMonthly)}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary-700" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Current Month</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(statsData.currentMonthAmount)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Loading State for Stats */}
      {statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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

      {/* Statements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-2xl font-black text-gray-950">Monthly Statements</h2>
          <p className="text-gray-600 text-sm mt-1">View and download your billing statements</p>
        </div>

        {/* Loading State */}
        {statementsLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {statementsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Failed to load statements</h3>
              <p className="text-red-700 text-sm mt-1">There was an error fetching your statements</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!statementsLoading && !statementsError && statementsData?.data.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No statements available</p>
            <p className="text-gray-500 text-sm mt-2">Your billing statements will appear here</p>
          </div>
        )}

        {/* Statements List */}
        {!statementsLoading && !statementsError && statementsData?.data && statementsData.data.length > 0 && (
          <div className="space-y-4">
            {statementsData.data.map((statement, index) => (
              <motion.div
                key={statement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-neutral-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all"
              >
                {/* Statement Header */}
                <button
                  onClick={() => toggleExpanded(statement.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-2.5 bg-primary-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-primary-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{statement.monthYear}</h3>
                        <p className="text-sm text-gray-500">Invoice for {statement.monthYear}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-12">
                      <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="text-lg font-black text-gray-950">{formatCurrency(statement.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="mt-1">{getStatusBadge(statement.status)}</div>
                      </div>
                      {statement.status === 'paid' && statement.paidDate && (
                        <div>
                          <p className="text-sm text-gray-600">Paid Date</p>
                          <p className="font-medium text-gray-900">{formatDate(statement.paidDate)}</p>
                        </div>
                      )}
                      {statement.status !== 'paid' && (
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="font-medium text-gray-900">{formatDate(statement.dueDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedStatements[statement.id] ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>

                {/* Statement Details */}
                {expandedStatements[statement.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-neutral-200 bg-gray-50 p-6"
                  >
                    <div className="space-y-4">
                      {/* Transaction List */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Transactions ({statement.transactions.length})</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {statement.transactions.map(transaction => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-100">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                                <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                              </div>
                              <span className={`font-semibold ${transaction.type === 'charge' ? 'text-red-600' : 'text-green-600'}`}>
                                {transaction.type === 'charge' ? '-' : '+'}{formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-white border border-neutral-100 rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Transactions</span>
                          <span className="font-semibold text-gray-900">{statement.transactionCount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                          <span className="font-semibold text-gray-900">Total Amount</span>
                          <span className="text-lg font-black text-gray-950">{formatCurrency(statement.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Download Button */}
                      <Button
                        variant="primary"
                        size="md"
                        isFullWidth
                        icon={<Download className="w-4 h-4" />}
                        isLoading={downloadingId === statement.id}
                        onClick={() => handleDownload(statement.id)}
                        className="mt-4"
                      >
                        Download Invoice PDF
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!statementsLoading && statementsData?.pagination && statementsData.pagination.totalPages > 1 && (
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
              disabled={!statementsData.pagination.hasPrevPage}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: statementsData.pagination.totalPages }, (_, i) => i + 1).map(page => (
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
              disabled={!statementsData.pagination.hasNextPage}
            >
              Next
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

