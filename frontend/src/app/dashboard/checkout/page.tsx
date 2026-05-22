'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import Button from '@/components/Button';
import Container from '@/components/Container';
import PaymentForm from '@/components/PaymentForm';
import paymentService, { PaymentIntentResponse } from '@/services/paymentService';
import { orderService } from '@/services/orderService';
import logger from '@/lib/logger';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setIntentError('Order ID not provided');
        setIsLoadingOrder(false);
        return;
      }

      try {
        setIsLoadingOrder(true);
        setIntentError(null);
        
        const order = await orderService.getOrderById(orderId);
        setOrderData(order);

        const amount = order.totalPrice ?? order.price;
        if (!amount) {
          throw new Error('Order amount not available');
        }

        const intent = await paymentService.createPaymentIntent({
          orderId,
          amount,
        });
        setPaymentIntent(intent);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load order';
        setIntentError(errorMsg);
        logger.error('Order loading error:', error);
      } finally {
        setIsLoadingOrder(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      logger.info('Payment successful:', paymentIntentId);
      setPaymentSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/esims?payment=success`);
      }, 2000);
    } catch (error) {
      logger.error('Failed to complete payment:', error);
      setIntentError('Payment completed but order confirmation failed');
    }
  };

  const handlePaymentError = (error: string) => {
    logger.error('Payment error:', error);
    setIntentError(error);
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-gray-50 flex items-center justify-center py-12">
        <Container>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!orderId || !orderData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-gray-50 py-12">
        <Container>
          <motion.div
            className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Invalid Order</h2>
            <p className="text-gray-600 text-center mb-6">The order information is missing or invalid.</p>
            <Link href="/dashboard/esims">
              <Button className="w-full">Back to eSIMs</Button>
            </Link>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-gray-50 py-12">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/esims" className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to eSIMs
          </Link>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Package className="w-8 h-8 text-primary-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
              <p className="text-gray-600 mt-2">Order #{orderData.orderNumber || orderId.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {paymentSuccess && (
              <motion.div
                className="mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl flex items-center gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Payment Successful!</p>
                  <p className="text-sm text-green-700">Redirecting to order details...</p>
                </div>
              </motion.div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
              {/* Error Alert */}
              <AnimatePresence>
                {intentError && (
                  <motion.div
                    className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700">{intentError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Payment Form */}
              {paymentIntent && !paymentSuccess && (
                <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
                  <PaymentForm
                    clientSecret={paymentIntent.clientSecret}
                    amount={orderData.totalPrice}
                    email={orderData.customerEmail}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </Elements>
              )}

              {/* Security Info */}
              {!paymentSuccess && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-start gap-3">
                  <Lock className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Secure & Encrypted</p>
                    <p className="text-sm text-gray-600">Your payment is protected by Stripe's advanced security.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>

              {/* Items */}
              <div className="space-y-3 border-b border-gray-200 pb-4">
                {orderData.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name || `Plan - ${item.country}`}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </span>
                    <span className="font-medium text-gray-900">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${(orderData.costPrice || orderData.totalPrice).toFixed(2)}</span>
                </div>
                {orderData.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${orderData.tax.toFixed(2)}</span>
                  </div>
                )}
                {orderData.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-${orderData.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total to Pay</span>
                  <span className="text-2xl font-bold text-primary-700">${orderData.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-primary-50 rounded-lg text-xs text-primary-900">
                <p className="font-medium mb-1">Instant Delivery</p>
                <p>Your eSIM will be delivered immediately after payment confirmation.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CheckoutContent />
    </Suspense>
  );
}

