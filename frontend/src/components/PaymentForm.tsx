'use client';

import { useCallback, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/Button';

interface PaymentFormProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  clientSecret: string;
  amount: number;
  email?: string;
  isProcessing?: boolean;
}

export default function PaymentForm({
  onPaymentSuccess,
  onPaymentError,
  clientSecret,
  amount,
  email,
  isProcessing: externalIsProcessing = false,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardComplete, setCardComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCardChange = useCallback((event: any) => {
    setCardComplete(event.complete);
    setError(event.error?.message || null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) {
        setError('Payment system not ready');
        return;
      }

      if (!clientSecret) {
        setError('Payment configuration missing');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        console.log('[PaymentForm] Processing payment for amount:', amount);
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        console.log('[PaymentForm] Confirming card payment with Stripe...');
        const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: email || undefined,
            },
          },
        });

        if (stripeError) {
          console.error('[PaymentForm] Stripe error:', stripeError);
          throw new Error(stripeError.message || 'Payment failed');
        }

        if (!paymentIntent) {
          throw new Error('Payment intent not returned');
        }

        console.log('[PaymentForm] Payment intent status:', paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
          console.log('[PaymentForm] Payment succeeded');
          setSuccess(true);
          onPaymentSuccess(paymentIntent.id);
        } else if (paymentIntent.status === 'processing') {
          console.log('[PaymentForm] Payment processing');
          setSuccess(true);
          onPaymentSuccess(paymentIntent.id);
        } else {
          throw new Error(`Payment failed with status: ${paymentIntent.status}`);
        }
      } catch (err) {
        console.error('[PaymentForm] Error:', err);
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
        setError(errorMsg);
        onPaymentError(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [stripe, elements, clientSecret, email, onPaymentSuccess, onPaymentError]
  );

  const isLoading = isProcessing || externalIsProcessing;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Element Container */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Details
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-lg bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
          <CardElement
            onChange={handleCardChange}
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Amount Display */}
      <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <p className="text-sm text-gray-600">Amount to charge</p>
        <p className="text-2xl font-bold text-primary-700">${amount.toFixed(2)}</p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Payment Failed</p>
            <p className="text-sm text-red-700 mt-1">{error || 'An unexpected error occurred. Please try again.'}</p>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Payment Successful</p>
            <p className="text-sm text-green-700 mt-1">Your payment has been processed.</p>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!cardComplete || isLoading || !stripe || success}
        isLoading={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : success ? 'Payment Complete' : `Pay $${amount.toFixed(2)}`}
      </Button>

      {/* Security Info */}
      <p className="text-xs text-center text-gray-500">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </motion.form>
  );
}

