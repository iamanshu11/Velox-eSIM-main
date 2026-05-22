import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingCart, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Card from './Card';

interface OrderItem {
  id: string;
  orderNo?: string;
  status: string;
  totalPrice?: number;
  createdAt: string;
}

interface DashboardRecentOrdersProps {
  orders: OrderItem[];
  isLoading?: boolean;
}

export default function DashboardRecentOrders({
  orders,
  isLoading,
}: DashboardRecentOrdersProps) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; icon: typeof CheckCircle2 }
  > = {
    Ready: { bg: 'bg-primary-50', text: 'text-primary-800', icon: ShoppingCart },
    Active: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: CheckCircle2,
    },
    Pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    Expired: { bg: 'bg-gray-50', text: 'text-gray-700', icon: AlertCircle },
    Suspended: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: AlertCircle,
    },
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.Pending;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
        <Link href="/dashboard/esims" className="text-primary-700 hover:text-primary-800 flex items-center gap-1">
          <span className="text-sm font-semibold">View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, 5).map((order, idx) => {
            const config = getStatusConfig(order.status);
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ShoppingCart className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      Order #{order.orderNo || order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {order.totalPrice && (
                    <span className="text-sm font-semibold text-gray-900">
                      ${order.totalPrice.toFixed(2)}
                    </span>
                  )}
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {order.status}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

