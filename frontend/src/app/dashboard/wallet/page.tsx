'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Loader, AlertCircle } from 'lucide-react';
import WalletBalance from '@/components/WalletBalance';
import { useGetTransactionHistoryQuery } from '@/store/slices/walletSlice';
import { Pagination } from '@/components/Dashboard/Pagination/Pagination';
import { getErrorMessage } from '@/utils/errorHandler';

export default function WalletPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: transactionData, isLoading, error } = useGetTransactionHistoryQuery({
    page,
    limit,
  });

  const transactions = transactionData?.transactions || [];
  const pagination = transactionData?.pagination;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'TOP_UP':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'ESIM_PURCHASE':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'REFUND':
        return <ArrowDownLeft className="w-5 h-5 text-primary-700" />;
      default:
        return <ArrowUpRight className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'TOP_UP':
        return 'Added Funds';
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
        return 'text-green-700 bg-green-50';
      case 'pending':
        return 'text-amber-700 bg-amber-50';
      case 'failed':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Wallet Balance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <WalletBalance variant="full" showTopUpButton={true} />
      </motion.div>

      {/* Transaction History Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-3xl font-black text-gray-950">Transaction History</h2>
          <p className="text-gray-600 mt-2">View all wallet transactions and top-ups</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{getErrorMessage(error, 'Failed to load transactions')}</span>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200"
          >
            <Loader className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 font-medium">No transactions yet</p>
            <p className="text-gray-500 text-sm mt-1">Start by adding funds to your wallet</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction: any, idx: number) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {getTransactionIcon(transaction.transactionType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {getTransactionLabel(transaction.transactionType)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {transaction.transactionType === 'ESIM_PURCHASE' ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Balance: ${transaction.balanceAfter.toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              hasNextPage={page < pagination.totalPages}
              hasPrevPage={page > 1}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
