import { motion } from 'framer-motion';
import { ArrowRight, Plus } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface CheckoutSummaryProps {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  walletBalance: number | null;
  isLoading: boolean;
  onCheckout: () => void;
  onTopUp?: () => void;
  canCheckout: boolean;
  dataAmount?: number;
  validity?: number;
  country?: string;
}

export default function CheckoutSummary({
  quantity,
  unitPrice,
  totalPrice,
  walletBalance,
  isLoading,
  onCheckout,
  onTopUp,
  canCheckout,
  dataAmount,
  validity,
  country,
}: CheckoutSummaryProps) {
  const sufficientBalance = walletBalance !== null && walletBalance >= totalPrice;
  const isWalletInsufficient = !sufficientBalance && walletBalance !== null;

  const formatDataAmount = (amount?: number): string => {
    if (!amount && amount !== 0) return 'N/A';
    if (amount >= 1) {
      return `${amount % 1 === 0 ? amount : amount.toFixed(1)} GB`;
    }
    return `${(amount * 1024).toFixed(0)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-1"
    >
      <Card className="p-6 sticky top-24">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

        {/* Plan Details */}
        {(country || dataAmount !== undefined || validity) && (
          <div className="space-y-2 pb-6 border-b border-gray-200">
            {country && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Country:</span>
                <span className="font-semibold text-gray-900">{country}</span>
              </div>
            )}
            {dataAmount !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data:</span>
                <span className="font-semibold text-gray-900">{formatDataAmount(dataAmount)}</span>
              </div>
            )}
            {validity && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Validity:</span>
                <span className="font-semibold text-gray-900">{validity} day{validity !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-3 pb-6 border-b border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Unit Price:</span>
            <span className="font-semibold text-gray-900">${unitPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-semibold text-gray-900">{quantity}</span>
          </div>
          {quantity > 1 && (
            <div className="flex justify-between text-sm bg-primary-50 p-2 rounded">
              <span className="text-primary-800">Subtotal:</span>
              <span className="font-semibold text-primary-900">${(unitPrice * quantity).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="py-4 flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Total:</span>
          <span className="text-3xl font-bold text-primary-700">${totalPrice.toFixed(2)}</span>
        </div>

        {/* Wallet Info */}
        {walletBalance !== null && (
          <div className={`p-3 rounded-lg mb-4 ${isWalletInsufficient ? 'bg-red-50' : 'bg-primary-50'}`}>
            <p className={`text-sm font-medium ${isWalletInsufficient ? 'text-red-700' : 'text-primary-700'}`}>
              {isWalletInsufficient ? (
                <>
                  Insufficient balance. Need ${(totalPrice - walletBalance).toFixed(2)} more.
                </>
              ) : (
                <>
                  Balance after purchase: ${(walletBalance - totalPrice).toFixed(2)}
                </>
              )}
            </p>
          </div>
        )}

        {/* Checkout Button */}
        {isWalletInsufficient ? (
          <>
            <Button
              onClick={onTopUp}
              className="w-full py-3 font-bold flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Top Up Wallet
            </Button>
            <p className="text-xs text-gray-600 text-center mt-3">
              You need ${(totalPrice - (walletBalance || 0)).toFixed(2)} more to complete this order.
            </p>
          </>
        ) : (
          <>
            <Button
              onClick={onCheckout}
              disabled={!canCheckout || isLoading}
              className={`w-full py-3 font-bold flex items-center justify-center gap-2 transition-all ${
                !canCheckout || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isLoading ? 'Processing...' : 'Order Now'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              By clicking "Order Now", you agree to our{' '}
              <a href="/terms" className="text-primary-700 hover:text-primary-800 underline">
                Terms & Conditions
              </a>
              .
            </p>
          </>
        )}
      </Card>
    </motion.div>
  );
}

