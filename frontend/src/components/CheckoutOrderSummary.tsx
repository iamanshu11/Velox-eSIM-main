import { motion } from 'framer-motion';
import Card from './Card';
import CountryFlagIcon from './CountryFlagIcon';
import { Minus, Plus } from 'lucide-react';

interface PlanItem {
  countryCode: string;
  country: string;
  operatorName: string;
  dataAmount?: number;
  validity?: number;
  price: number;
  features?: string[];
}

interface OrderSummaryProps {
  plan: PlanItem;
  quantity?: number;
  onQuantityChange?: (quantity: number) => void;
}

export default function OrderSummary({ 
  plan, 
  quantity = 1,
  onQuantityChange 
}: OrderSummaryProps) {
  const formatDataAmount = (amount?: number): string => {
    if (!amount && amount !== 0) return 'N/A';
    if (amount >= 1) {
      return `${amount % 1 === 0 ? amount : amount.toFixed(1)} GB`;
    }
    return `${(amount * 1024).toFixed(0)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="lg:col-span-2"
    >
      <Card className="p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

        {/* Plan Details */}
        <div className="bg-linear-to-r from-primary-50 to-indigo-50 rounded-xl p-6 mb-8 border border-primary-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <CountryFlagIcon countryCode={plan.countryCode} />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.country}</h3>
                <p className="text-sm text-gray-600">{plan.operatorName}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Data</p>
              <p className="text-xl font-bold text-gray-900">
                {formatDataAmount(plan.dataAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Validity</p>
              <p className="text-xl font-bold text-gray-900">
                {plan.validity ? `${plan.validity} day${plan.validity !== 1 ? 's' : ''}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Price</p>
              <p className="text-xl font-bold text-gray-900">
                ${plan.price.toFixed(2)}
              </p>
            </div>
          </div>

          {plan.features && plan.features.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Features</p>
              <div className="flex flex-wrap gap-2">
                {plan.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 bg-white border border-primary-200 rounded-full text-sm text-primary-800 font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        {onQuantityChange && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-4">How many eSIMs?</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg border border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <Minus size={18} className="text-gray-600" />
              </button>
              
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    onQuantityChange(val);
                  }
                }}
                className="w-20 text-center py-2 px-3 border border-gray-300 rounded-lg font-semibold text-gray-900 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
              
              <button
                onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
                className="p-2 rounded-lg border border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <Plus size={18} className="text-gray-600" />
              </button>
              
              <span className="text-sm text-gray-600 ml-auto">
                Max 10 eSIMs
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

