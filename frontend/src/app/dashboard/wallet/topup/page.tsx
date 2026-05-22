'use client';

import { useState, useEffect, Suspense } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Container from '@/components/Container';
import PaymentForm from '@/components/PaymentForm';
import stripeService, { PaymentIntentResponse } from '@/services/stripeService';
import { walletService } from '@/services/walletService';
import logger from '@/lib/logger';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

interface TopUpOption {
  amount: number;
  label: string;
  popular?: boolean;
}

const TOP_UP_OPTIONS: TopUpOption[] = [
  { amount: 5, label: '$5' },
  { amount: 10, label: '$10', popular: true },
  { amount: 25, label: '$25' },
  { amount: 50, label: '$50' },
  { amount: 100, label: '$100' },
  { amount: 250, label: '$250' },
];

function WalletTopUpContent() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  useEffect(() => {
    const loadWalletInfo = async () => {
      try {
        setIsLoadingWallet(true);
        const wallet = await walletService.getWallet();
        setWalletBalance(wallet.balance);
        setUserEmail(wallet.userId || '');
      } catch (error) {
        logger.error('Failed to load wallet:', error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    loadWalletInfo();
  }, []);

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const isValidAmount = finalAmount >= 0.5 && finalAmount <= 10000;

  useEffect(() => {
    const createIntent = async () => {
      if (!isValidAmount) {
        setPaymentIntent(null);
        setIntentError(null);
        return;
      }

      try {
        setIsLoadingIntent(true);
        setIntentError(null);
        const intent = await stripeService.createTopUpIntent(finalAmount);
        setPaymentIntent(intent);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to create payment intent';
        setIntentError(errorMsg);
        logger.error('Payment intent error:', error);
      } finally {
        setIsLoadingIntent(false);
      }
    };

    createIntent();
  }, [finalAmount, isValidAmount]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      logger.info('Payment successful:', paymentIntentId);
      const updatedWallet = await walletService.getWallet();
      setWalletBalance(updatedWallet.balance);
      setTimeout(() => {
        router.push('/dashboard/wallet?success=true');
      }, 2000);
    } catch (error) {
      logger.error('Failed to update wallet after payment:', error);
    }
  };

  const handlePaymentError = (error: string) => {
    logger.error('Payment error:', error);
    setIntentError(error);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-gray-50 py-12">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/wallet" className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Wallet
          </Link>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Wallet className="w-8 h-8 text-primary-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Funds to Wallet</h1>
              <p className="text-gray-600 mt-2">Quick and secure top-up with your card</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
              {/* Amount Selection */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Amount</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TOP_UP_OPTIONS.map((option) => (
                    <motion.button
                      key={option.amount}
                      onClick={() => {
                        setSelectedAmount(option.amount);
                        setCustomAmount('');
                      }}
                      className={`p-4 rounded-lg border-2 font-semibold transition-all relative ${
                        !customAmount && selectedAmount === option.amount
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {option.label}
                      {option.popular && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(0);
                    }}
                    placeholder="Enter amount (0.50 - 10000)"
                    step="0.01"
                    min="0.50"
                    max="10000"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
                {customAmount && !isValidAmount && (
                  <p className="text-red-500 text-sm mt-2">Amount must be between $0.50 and $10,000</p>
                )}
              </div>

              {/* Stripe Payment Form */}
              {isValidAmount && paymentIntent && (
                <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
                  <PaymentForm
                    clientSecret={paymentIntent.clientSecret}
                    amount={finalAmount}
                    email={userEmail}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    isProcessing={isLoadingIntent}
                  />
                </Elements>
              )}

              {/* Intent Error */}
              {intentError && !isValidAmount === false && (
                <motion.div
                  className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Payment Failed</p>
                    <p className="text-sm text-red-700 mt-1">{intentError || 'An unexpected error occurred. Please try again.'}</p>
                  </div>
                </motion.div>
              )}

              {/* Amount Not Valid */}
              {!isValidAmount && (
                <motion.div
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Invalid Amount</p>
                    <p className="text-sm text-yellow-700">Please enter an amount between $0.50 and $10,000</p>
                  </div>
                </motion.div>
              )}

              {/* Security Info */}
              <div className="p-4 bg-gray-50 rounded-lg flex items-start gap-3">
                <Lock className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure & Encrypted</p>
                  <p className="text-sm text-gray-600">All transactions are protected by Stripe's advanced security.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar - Wallet Info & FAQ */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Wallet Balance */}
            <div className="bg-linear-to-br from-primary-900 to-primary-700 text-white rounded-xl shadow-lg p-6">
              <p className="text-sm opacity-90 mb-2">Current Balance</p>
              {isLoadingWallet ? (
                <div className="h-10 bg-primary-500 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold">${walletBalance.toFixed(2)}</p>
              )}
              <p className="text-xs opacity-75 mt-4">After this top-up: ${(walletBalance + finalAmount).toFixed(2)}</p>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Frequently Asked</h3>
              
              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-700 flex justify-between items-center">
                  How long does it take?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-gray-600 mt-2">Most payments are processed instantly. Some may take up to 24 hours.</p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-700 flex justify-between items-center">
                  Is it safe?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-gray-600 mt-2">Yes! We use Stripe, the most trusted payment processor globally.</p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-700 flex justify-between items-center">
                  Any fees?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-gray-600 mt-2">No hidden fees. You pay exactly what you see.</p>
              </details>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}

export default function WalletTopUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <WalletTopUpContent />
    </Suspense>
  );
}

