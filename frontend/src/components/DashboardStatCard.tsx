import { motion } from 'framer-motion';
import React from 'react';

interface DashboardStatCardProps {
  icon: React.ComponentType<{ className: string }>;
  label: string;
  value: string | number;
  change?: string | number;
  color?: string;
  bgColor?: string;
  delay?: number;
}

export default function DashboardStatCard({
  icon: Icon,
  label,
  value,
  change,
  color = 'text-primary-700',
  bgColor = 'bg-primary-50',
  delay = 0,
}: DashboardStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${bgColor} group-hover:scale-110 transition-transform`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {change && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );
}

