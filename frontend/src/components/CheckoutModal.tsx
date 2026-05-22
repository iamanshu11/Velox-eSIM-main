'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';

import { clearSelectedPlan } from '@/store/slices/planSlice';
import { orderService } from '@/services/orderService';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

import type { Plan } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSuccess?: (orderId: string) => void;
}

interface CheckoutState {
  isProcessing: boolean;
  error: string | null;
  success: boolean;
  orderId: string | null;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
}: CheckoutModalProps) {
  const dispatch = useDispatch();

  const [state, setState] = useState<CheckoutState>({
    isProcessing: false,
    error: null,
    success: false,
    orderId: null,
  });

  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!plan) return null;

  const totalPrice = plan.price * quantity;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setQuantity(value);
  };

  const handleCheckout = async () => {
    if (!email || !phone) {
      setState(prev => ({ ...prev, error: 'Please fill in all required fields' }));
      return;
    }

    if (!termsAccepted) {
      setState(prev => ({ ...prev, error: 'Please accept the terms and conditions' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const order = await orderService.createOrder({
        items: [{ planId: plan.id, quantity }],
      });

      setState(prev => ({
        ...prev,
        orderId: order.id,
        success: true,
        isProcessing: false,
      }));

      dispatch(clearSelectedPlan());
      if (onSuccess) {
        onSuccess(order.id);
      }
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      setState(prev => ({ ...prev, error: errorMessage, isProcessing: false }));
    }
  };

  const handleClose = () => {
    setState({
      isProcessing: false,
      error: null,
      success: false,
      orderId: null,
    });
    setQuantity(1);
    setEmail('');
    setPhone('');
    setTermsAccepted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title="Complete Your Order"
          size="xl"
        >
          {state.success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
              <p className="text-gray-600 mb-4">
                Your order #{state.orderId} has been confirmed.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to order details...
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Plan Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-linear-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200"
              >
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">
                      {plan.country} • {plan.operatorName}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      {plan.dataAmount && (
                        <span className="text-gray-700">
                          <span className="font-semibold">{plan.dataAmount}</span> {plan.dataUnit || 'GB'}
                        </span>
                      )}
                      {plan.validity && (
                        <span className="text-gray-700">
                          <span className="font-semibold">{plan.validity}</span> {plan.validityUnit || 'days'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Price per SIM</p>
                    <p className="text-2xl font-bold text-gray-900">${plan.price.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-4"
              >
                <h4 className="font-semibold text-gray-900">Contact Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Quantity Selection */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <label className="block font-semibold text-gray-900">
                  Number of eSIMs
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                />
              </motion.div>

              {/* Terms */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-start gap-3"
              >
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-primary-700 cursor-pointer rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-primary-700 hover:text-primary-800 font-medium">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-primary-700 hover:text-primary-800 font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </motion.div>

              {/* Error Message */}
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{state.error}</p>
                </motion.div>
              )}

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="font-medium text-gray-900">${plan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">{quantity}x</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-700">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                  disabled={state.isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={state.isProcessing || !email || !phone || !termsAccepted}
                  className="flex-1 bg-primary-700 hover:bg-primary-800 text-white disabled:opacity-50"
                >
                  {state.isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Complete Purchase - $${totalPrice.toFixed(2)}`
                  )}
                </Button>
              </div>

              {/* Security Badge */}
              <p className="text-xs text-gray-500 text-center">
                ✓ Secure & Encrypted
              </p>
            </div>
          )}
        </Modal>
      )}
    </AnimatePresence>
  );
}

