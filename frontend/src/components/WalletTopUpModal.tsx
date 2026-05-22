'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader, CreditCard, DollarSign } from 'lucide-react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useInitiateTopUpMutation, useConfirmTopUpMutation } from '@/store/slices/walletSlice';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ''
);

const TOPUP_AMOUNTS = [
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
  { label: '$15', value: 15 },
  { label: '$20', value: 20 },
  { label: '$50', value: 50 },
  { label: '$100', value: 100 },
];

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

function PaymentForm({ amount, onSuccess, onClose }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [initiateTopUp] = useInitiateTopUpMutation();
  const [confirmTopUp] = useConfirmTopUpMutation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validateInputs = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!amount || amount <= 0) {
      newErrors.amount = 'Please select or enter a valid amount';
    }

    if (amount < 2) {
      newErrors.amount = 'Minimum top-up is $2';
    }

    if (amount > 3000) {
      newErrors.amount = 'Maximum top-up is $3,000';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) return;

    if (!stripe || !elements) {
      setError('Stripe is not properly initialized. Please refresh the page.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
      setError('Stripe configuration is missing. Please contact support.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      const paymentIntentResult = await initiateTopUp(amount).unwrap();

      if (!paymentIntentResult.clientSecret) {
        throw new Error('Failed to create payment intent. Please try again.');
      }
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentResult.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Customer',
            },
          },
        }
      );

      if (stripeError) {
        if (stripeError.type === 'card_error') {
          throw new Error(`Card error: ${stripeError.message}`);
        } else if (stripeError.type === 'validation_error') {
          throw new Error(`Validation error: ${stripeError.message}`);
        } else {
          throw new Error(stripeError.message || 'Payment failed. Please try again.');
        }
      }
      if (!paymentIntent) {
        throw new Error('Payment intent not returned from Stripe');
      }

      if (paymentIntent.status === 'succeeded') {
        try {
          await confirmTopUp(paymentIntentResult.paymentIntentId).unwrap();
        } catch (confirmError) {
          console.error('Backend confirmation failed:', confirmError);
          throw new Error(
            'Payment succeeded but wallet update failed. Please contact support with payment ID: ' +
              paymentIntentResult.paymentIntentId
          );
        }

        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else if (paymentIntent.status === 'requires_payment_method') {
        throw new Error('Please provide a valid card');
      } else if (paymentIntent.status === 'requires_action') {
        throw new Error('Additional authentication required. Please check your card issuer.');
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}. Please try again.`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-linear-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-6 text-center"
      >
        <p className="text-sm text-gray-600 font-medium mb-2">Total Payment</p>
        <div className="flex items-center justify-center gap-2">
          <DollarSign className="w-8 h-8 text-primary-700" />
          <p className="text-4xl font-bold text-gray-900">{amount.toFixed(2)}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">This amount will be added to your wallet</p>
      </motion.div>

      {/* Card Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <label className="block text-sm font-semibold text-gray-900 items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary-700" />
          Card Details
        </label>
        <div className="relative">
          <div className="border-2 border-gray-200 hover:border-primary-400 focus-within:border-primary-600 rounded-lg p-4 bg-white transition-all">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1e293b',
                    fontFamily: 'system-ui, sans-serif',
                    '::placeholder': {
                      color: '#cbd5e1',
                    },
                  },
                  invalid: {
                    color: '#dc2626',
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your card information is secured by Stripe. We never store your card details.
          </p>
        </div>
      </motion.div>

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {Object.entries(validationErrors).map(([field, msg]) => (
            <div
              key={field}
              className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">{msg}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Payment Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg"
        >
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Payment Successful!</p>
            <p className="text-sm text-green-700">Your wallet has been credited.</p>
          </div>
        </motion.div>
      )}

      {/* Submission Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          type="submit"
          disabled={isProcessing || !stripe || success}
          className="w-full py-3 bg-primary-700 hover:bg-primary-800 disabled:bg-gray-400 font-semibold text-white rounded-lg transition-all"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Processing Payment...
            </span>
          ) : success ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Payment Complete
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pay ${amount.toFixed(2)} Now
            </span>
          )}
        </Button>
      </motion.div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-green-600 rounded-full" />
        </div>
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
}

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WalletTopUpModal({ isOpen, onClose, onSuccess }: WalletTopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const isValidAmount = amount && amount > 0;

  const handleClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setShowPaymentForm(false);
    onClose();
  };

  const handleSuccess = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setShowPaymentForm(false);
    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Funds to Your Wallet">
      <AnimatePresence mode="wait">
        {!showPaymentForm ? (
          <motion.div
            key="amount-selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Preset Amounts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary-700" />
                  Quick Select
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Popular</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {TOPUP_AMOUNTS.map((option, idx) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedAmount(option.value);
                      setCustomAmount('');
                    }}
                    className={`py-4 px-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                      selectedAmount === option.value
                        ? 'bg-primary-700 text-white shadow-lg ring-2 ring-primary-400 ring-offset-2'
                        : 'bg-gray-50 border-2 border-gray-200 text-gray-800 hover:border-primary-400 hover:bg-primary-50'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Custom Amount Input */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">$</span>
                Custom Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="2"
                  max="3000"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>💡 Minimum: $2</span>
                <span>Maximum: $3,000</span>
              </div>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-linear-to-r from-primary-50 to-primary-100 border-2 border-primary-100 rounded-xl p-4 space-y-2"
            >
              <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
                <span className="text-lg">✓</span>
                Instant Credit
              </p>
              <p className="text-sm text-gray-700">
                Your wallet will be credited immediately after payment confirmation. Use it anytime to purchase eSIMs.
              </p>
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={() => setShowPaymentForm(true)}
                disabled={!isValidAmount}
                className="w-full py-3 bg-primary-700 hover:bg-primary-800 disabled:bg-gray-300 text-white font-bold rounded-xl"
              >
                Continue to Payment
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="payment-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Elements stripe={stripePromise}>
              <PaymentForm
                amount={amount || 0}
                onSuccess={handleSuccess}
                onClose={handleClose}
              />
            </Elements>

            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              ← Back to Amount Selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
