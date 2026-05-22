'use client';

import Button from '@/components/Button';
import WalletTopUpModal from '@/components/WalletTopUpModal';
import {
  useGetWalletBalanceQuery,
} from '@/store/slices/walletSlice';
import { RootState } from '@/store';
import { motion } from 'framer-motion';
import { Plus, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

interface WalletBalanceProps {
  showTopUpButton?: boolean;
  className?: string;
  variant?: 'compact' | 'full';
}

export default function WalletBalance({
  showTopUpButton = true,
  className = '',
  variant = 'compact',
}: WalletBalanceProps) {
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const { data: wallet, isLoading, refetch } = useGetWalletBalanceQuery(undefined, {
    skip: !isAuthenticated,
  });
  useEffect(() => {
    if (isAuthenticated && userId) {
      refetch();
    }
  }, [userId, isAuthenticated, refetch]);
  const balance = typeof wallet?.balance === 'number' && wallet.balance >= 0 
    ? wallet.balance 
    : 0;

  const handleTopUpSuccess = () => {
    refetch();
  };

  if (variant === 'compact') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-3 py-2 bg-white/85 border border-neutral-200 rounded-full shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-sm cursor-pointer hover:bg-white/95 transition-colors ${className}`}
          onClick={() => showTopUpButton && setIsTopUpModalOpen(true)}
        >
          <Wallet className="w-4 h-4 text-primary-700" />
          {isLoading ? (
            <div className="h-5 w-14 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className="text-sm font-bold text-slate-900">
              ${balance.toFixed(2)}
            </p>
          )}
        </motion.div>

        {showTopUpButton && (
          <WalletTopUpModal
            isOpen={isTopUpModalOpen}
            onClose={() => setIsTopUpModalOpen(false)}
            onSuccess={handleTopUpSuccess}
          />
        )}
      </>
    );
  }
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 bg-linear-to-br from-primary-900 to-primary-700 rounded-xl text-white shadow-lg ${className}`}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-primary-100 font-medium mb-2">Your Wallet Balance</p>
            {isLoading ? (
              <div className="h-10 w-32 bg-primary-200 rounded-lg animate-pulse" />
            ) : (
              <p className="text-4xl text-neutral-100 font-bold">${balance.toFixed(2)}</p>
            )}
          </div>
          <Wallet className="w-12 h-12 text-neutral-50 opacity-30" />
        </div>

        <div className="text-sm text-neutral-50 mb-6 space-y-1">
          <p className='text-neutral-50'>Use your wallet balance to purchase eSIMs.</p>
          <p className='text-neutral-50'>Unlike gift cards, your balance never expires.</p>
        </div>

        {showTopUpButton && (
          <Button
            onClick={() => setIsTopUpModalOpen(true)}
            variant="secondary"
            size="lg"
            className="w-full bg-white text-primary-700 hover:bg-primary-50"
          >
            <Plus className="w-5 h-5" />
            Add Funds to Wallet
          </Button>
        )}
      </motion.div>

      <WalletTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </>
  );
}
