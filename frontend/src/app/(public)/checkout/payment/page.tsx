'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Lock,
  Loader,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';

import Container from '@/components/Container';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import logger from '@/lib/logger';
import { usePaymentForm } from '@/hooks/usePaymentForm';
import { PaymentService } from '@/services/paymentService';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);
interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  success: boolean;
  clientSecret?: string;
  isInitializing: boolean;
}
const InvalidPaymentView = () => (
  <Layout showFooter={false}>
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-24 text-center"
      >
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Invalid Payment Details
        </h1>
        <p className="text-gray-600 mb-8">
          The payment information is incomplete or invalid.
        </p>
        <Link href="/esim">
          <Button className="bg-primary-700 hover:bg-primary-800 text-white">
            Back to Plans
          </Button>
        </Link>
      </motion.div>
    </Container>
  </Layout>
);
interface PaymentErrorProps {
  error: string;
  onDismiss: () => void;
}

const PaymentError = ({ error, onDismiss }: PaymentErrorProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
  >
    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="font-semibold text-red-900">{error}</p>
      <p className="text-sm text-red-700 mt-1">
        Please try again or contact support if the problem persists.
      </p>
    </div>
    <button
      onClick={onDismiss}
      className="text-red-600 hover:text-red-700 font-bold text-lg mt-1"
    >
      ×
    </button>
  </motion.div>
);
const PaymentSuccessView = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-12"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="inline-block mb-4"
    >
      <CheckCircle className="w-16 h-16 text-green-600" />
    </motion.div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
    <p className="text-gray-600">Your payment has been processed. Redirecting...</p>
  </motion.div>
);
interface FormInputProps {
  label: string;
  type: 'text' | 'email';
  name: string;
  value: string;
  error?: string;
  touched: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder: string;
  delay: number;
}

const FormInput = ({
  label,
  type,
  name,
  value,
  error,
  touched,
  onChange,
  onBlur,
  disabled,
  placeholder,
  delay,
}: FormInputProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-3 border rounded-lg outline-none transition-all disabled:bg-gray-100 ${
        error && touched
          ? 'border-red-500 focus:ring-2 focus:ring-red-500'
          : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
      }`}
    />
    {error && touched && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </motion.div>
);
interface OrderSummaryProps {
  amount: number;
  packageCode: string;
  quantity: number;
}

const OrderSummary = ({ amount, packageCode, quantity }: OrderSummaryProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    <Card className="p-6 sticky top-24">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        Order Summary
      </h3>

      <div className="space-y-3 pb-4 border-b">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Package</span>
          <span className="font-medium text-gray-900">{packageCode}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantity</span>
          <span className="font-medium text-gray-900">{quantity}</span>
        </div>
      </div>

      <div className="flex justify-between text-lg font-bold text-gray-900 mt-4">
        <span>Total</span>
        <span className="text-primary-700">${amount.toFixed(2)}</span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Lock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <span>SSL Encrypted</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <span>PCI DSS Compliant</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <span>Fraud Protection</span>
        </div>
      </div>
    </Card>
  </motion.div>
);
function PaymentForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();

  const amount = parseFloat(searchParams.get('amount') || '0');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  const packageCode = searchParams.get('packageCode') || '';

  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    success: false,
    isInitializing: true,
  });

  const {
    formData,
    handleChange,
    handleBlur,
    validate,
    getFieldError,
    getFieldTouched,
  } = usePaymentForm();
  const initializationAttempted = useRef(false);

  useEffect(() => {
    if (amount <= 0) {
      setPaymentState((prev) => ({ ...prev, isInitializing: false }));
      return;
    }
    if (initializationAttempted.current) {
      logger.info('[PaymentPage] Payment intent already initialized, skipping duplicate');
      return;
    }

    initializationAttempted.current = true;

    const initializePayment = async () => {
      try {
        logger.info('[PaymentPage] Initializing payment intent', {
          amount,
          packageCode,
          quantity,
        });

        const response = await PaymentService.createPurchaseIntent({
          amount: Number(amount),
          packageCode,
          quantity,
        });

        setPaymentState((prev) => ({
          ...prev,
          clientSecret: response.clientSecret,
          isInitializing: false,
        }));

        logger.info('[PaymentPage] Payment intent initialized', {
          intentId: response.paymentIntentId,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to initialize payment';
        logger.error('[PaymentPage] Initialization failed', error);

        setPaymentState((prev) => ({
          ...prev,
          error: errorMsg,
          isInitializing: false,
        }));
      }
    };

    initializePayment();
  }, [amount]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        logger.warn('[PaymentPage] Form validation failed');
        setPaymentState((prev) => ({
          ...prev,
          error: 'Please complete all required fields correctly',
        }));
        return;
      }

      if (!stripe || !elements || !paymentState.clientSecret) {
        logger.error('[PaymentPage] Stripe not ready', {
          hasStripe: !!stripe,
          hasElements: !!elements,
          hasSecret: !!paymentState.clientSecret,
        });
        setPaymentState((prev) => ({
          ...prev,
          error: 'Payment system not ready. Please refresh the page.',
        }));
        return;
      }

      const paramValidation = PaymentService.validatePaymentParams(amount, packageCode);
      if (!paramValidation.valid) {
        logger.warn('[PaymentPage] Payment params validation failed', {
          amount,
          packageCode,
          error: paramValidation.error,
        });
        setPaymentState((prev) => ({
          ...prev,
          error: paramValidation.error || 'Invalid payment parameters',
        }));
        return;
      }

      setPaymentState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
          throw new Error('Card element not initialized');
        }

        logger.info('[PaymentPage] Processing payment', {
          amount,
          packageCode,
          currency: 'USD',
        });

        const confirmResult = await PaymentService.confirmCardPayment({
          clientSecret: paymentState.clientSecret,
          stripe,
          cardElement,
          billingDetails: {
            name: formData.name,
            email: formData.email,
          },
        });

        if (!confirmResult.success) {
          const errorMsg = confirmResult.error || 'Payment confirmation failed';
          logger.error('[PaymentPage] Payment confirmation failed', {
            error: errorMsg,
          });
          throw new Error(errorMsg);
        }

        logger.info('[PaymentPage] Payment confirmed successfully', {
          intentId: confirmResult.intentId,
          status: confirmResult.status,
        });

        setPaymentState((prev) => ({
          ...prev,
          success: true,
          error: null,
        }));
        setTimeout(() => {
          router.push(
            `/checkout/success?orderAmount=${amount}&packageCode=${packageCode}`
          );
        }, 2000);
      } catch (error) {
        let errorMsg = 'An unexpected error occurred. Please try again.';
        
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
        
        logger.error('[PaymentPage] Payment processing error', {
          error: errorMsg,
          originalError: error,
        });

        setPaymentState((prev) => ({
          ...prev,
          error: errorMsg,
          isProcessing: false,
        }));
      }
    },
    [stripe, elements, paymentState, formData, validate, amount, packageCode, router]
  );

  if (amount <= 0 || !packageCode) {
    return <InvalidPaymentView />;
  }

  if (paymentState.isInitializing) {
    return (
      <Layout showFooter={false}>
        <Container>
          <div className="py-24 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader className="w-12 h-12 text-primary-700" />
            </motion.div>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/checkout"
            className="flex items-center gap-2 text-primary-700 hover:text-primary-800 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Checkout
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600 mt-2">Complete your payment securely</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 max-w-5xl">
          <div className="lg:col-span-2">
            <Card className="p-8">
              {paymentState.error && (
                <PaymentError
                  error={paymentState.error}
                  onDismiss={() =>
                    setPaymentState((prev) => ({ ...prev, error: null }))
                  }
                />
              )}

              {paymentState.success ? (
                <PaymentSuccessView />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Contact Information
                    </h3>

                    <FormInput
                      label="Full Name"
                      type="text"
                      name="name"
                      value={formData.name}
                      error={getFieldError('name')}
                      touched={getFieldTouched('name')}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={paymentState.isProcessing}
                      placeholder="John Doe"
                      delay={0.1}
                    />

                    <FormInput
                      label="Email Address"
                      type="email"
                      name="email"
                      value={formData.email}
                      error={getFieldError('email')}
                      touched={getFieldTouched('email')}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={paymentState.isProcessing}
                      placeholder="you@example.com"
                      delay={0.15}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-green-600" />
                      Card Details
                    </h3>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Information
                      </label>
                      <div className="border-2 border-gray-300 hover:border-primary-300 focus-within:border-primary-500 rounded-lg p-4 bg-white transition-colors">
                        <CardElement
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#1e293b',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
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
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Your card information is encrypted and never stored.
                      </p>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      type="submit"
                      disabled={
                        paymentState.isProcessing ||
                        !stripe ||
                        !paymentState.clientSecret
                      }
                      className="w-full py-4 bg-primary-700 hover:bg-primary-800 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {paymentState.isProcessing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Pay ${amount.toFixed(2)}
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-2 text-xs text-gray-600 pt-2"
                  >
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span>Secured by Stripe • 256-bit SSL Encrypted</span>
                  </motion.div>
                </form>
              )}
            </Card>
          </div>

          <OrderSummary amount={amount} packageCode={packageCode} quantity={quantity} />
        </div>
      </Container>
    </Layout>
  );
}
export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <Layout showFooter={false}>
          <Container>
            <div className="py-24 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader className="w-12 h-12 text-primary-700" />
              </motion.div>
            </div>
          </Container>
        </Layout>
      }
    >
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </Suspense>
  );
}

