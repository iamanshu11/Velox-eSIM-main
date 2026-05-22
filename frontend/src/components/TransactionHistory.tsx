'use client';

import Card from '@/components/Card';
import { useGetTransactionHistoryQuery } from '@/store/slices/walletSlice';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Loader } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/utils/formatters';

interface TransactionHistoryProps {
  pageSize?: number;
  className?: string;
}

export default function TransactionHistory({
  pageSize = 20,
  className = '',
}: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: historyData, isLoading, error } = useGetTransactionHistoryQuery({
    page: currentPage,
    limit: pageSize,
  });

  const transactions = historyData?.transactions ?? [];
  const pagination = historyData?.pagination;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'TOP_UP':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'ESIM_PURCHASE':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'REFUND':
        return <ArrowDownLeft className="w-5 h-5 text-primary-700" />;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'TOP_UP':
        return 'Top-up';
      case 'ESIM_PURCHASE':
        return 'eSIM Purchase';
      case 'REFUND':
        return 'Refund';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };



  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-8 flex justify-center">
          <Loader className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <div className="p-6 flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Failed to load transaction history</p>
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <div className="p-12 text-center">
          <p className="text-slate-500">No transactions yet</p>
          <p className="text-sm text-slate-400 mt-2">
            Your transaction history will appear here once you make your first transaction.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Transaction History</h3>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-slate-200">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left Section: Icon & Details */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="shrink-0 p-2 bg-slate-100 rounded-lg">
                    {getTransactionIcon(transaction.transactionType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">
                      {getTransactionLabel(transaction.transactionType)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Middle Section: Amount */}
                <div className="text-right shrink-0">
                  <p
                    className={`font-semibold ${
                      transaction.transactionType === 'TOP_UP' || transaction.transactionType === 'REFUND'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.transactionType === 'TOP_UP' || transaction.transactionType === 'REFUND'
                      ? '+'
                      : '-'}
                    ${transaction.amount.toFixed(2)}
                  </p>
                </div>

                {/* Right Section: Status */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border capitalize shrink-0 ${getStatusColor(
                    transaction.status
                  )}`}
                >
                  {transaction.status}
                </span>
              </div>

              {/* Balance Change */}
              <div className="mt-2 ml-12 text-xs text-slate-500">
                <p>Balance: ${transaction.balanceBefore.toFixed(2)} → ${transaction.balanceAfter.toFixed(2)}</p>
              </div>

              {/* Error Message */}
              {transaction.failureReason && (
                <div className="mt-2 ml-12 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {transaction.failureReason}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 rounded border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
