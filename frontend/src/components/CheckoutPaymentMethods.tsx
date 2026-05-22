import { Wallet as WalletIcon } from 'lucide-react';
import Card from './Card';

interface PaymentMethodsProps {
  walletBalance: number | null;
  walletLoading: boolean;
  totalPrice: number;
}

export default function PaymentMethods({
  walletBalance,
  walletLoading,
  totalPrice,
}: PaymentMethodsProps) {
  const sufficientBalance = walletBalance !== null && walletBalance >= totalPrice;

  return (
    <Card className="p-8 mb-8">
      <h3 className="text-lg font-bold text-primary-900 mb-4">Payment Method</h3>
      <div className="space-y-3">
        {/* Wallet Balance - Only Payment Method */}
        <div className="w-full p-4 rounded-lg border-2 border-primary-600 bg-primary-50 flex items-start gap-4">
          <WalletIcon className="w-6 h-6 shrink-0 mt-0.5 text-primary-700" />
          <div className="text-left flex-1">
            <p className="font-semibold text-primary-900">Wallet Balance</p>
            <p className="text-sm text-primary-700">
              {walletLoading ? 'Loading...' : `$${(walletBalance || 0).toFixed(2)}`}
            </p>
            {!sufficientBalance && walletBalance !== null && (
              <p className="text-xs text-red-600 mt-1">
                Insufficient balance (Need: ${totalPrice.toFixed(2)})
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
