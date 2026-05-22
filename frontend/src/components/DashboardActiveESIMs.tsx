'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Smartphone } from 'lucide-react';
import Card from './Card';
import ActiveESIMProgressCard from './ActiveESIMProgressCard';

interface ESIMPlan {
  countryCode: string;
  name: string;
}

interface ESIMItem {
  id: string;
  orderNo?: string;
  iccid?: string;
  esimStatus?: string;
  status?: string;
  plan?: ESIMPlan;
  expiresAt?: string;
  expiredTime?: string;
  activatedAt?: string;
  daysUntilExpiry?: number;
  totalVolume?: number;
  dataUsage?: number;
  dataUsagePercent?: number;
  remainingVolume?: number;
  packages?: any[];
}

interface DashboardActiveESIMsProps {
  esims: ESIMItem[];
  isLoading?: boolean;
}

export default function DashboardActiveESIMs({
  esims,
  isLoading,
}: DashboardActiveESIMsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Active eSIMs</h3>
        <Link href="/dashboard/esims" className="text-primary-700 hover:text-primary-800 flex items-center gap-1">
          <span className="text-sm font-semibold">View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : esims.length === 0 ? (
        <div className="text-center py-12">
          <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No active eSIMs yet</p>
          <Link
            href="/esim"
            className="inline-flex items-center gap-1 px-4 py-2 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition"
          >
            Buy an eSIM →
          </Link>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
        >
          {esims.slice(0, 5).map((esim, idx) => (
            <ActiveESIMProgressCard
              key={esim.id}
              id={esim.id}
              orderNo={esim.orderNo || esim.id}
              iccid={esim.iccid}
              status={esim.status || esim.esimStatus || 'Active'}
              totalVolume={esim.totalVolume}
              dataUsage={esim.dataUsage}
              dataUsagePercent={esim.dataUsagePercent}
              remainingVolume={esim.remainingVolume}
              activatedAt={esim.activatedAt}
              expiresAt={esim.expiresAt || esim.expiredTime}
              daysUntilExpiry={esim.daysUntilExpiry}
              plan={esim.plan}
              packages={esim.packages}
              index={idx}
            />
          ))}
        </motion.div>
      )}
    </Card>
  );
}
