'use client';

import { motion } from 'framer-motion';
import { PackageData } from './PackageCard';
import { useMemo } from 'react';

interface PlansGroupedByValidityProps {
  plans: PackageData[];
  onSelectPlan: (plan: PackageData) => void;
}

interface GroupedPlan {
  duration: number;
  durationLabel: string;
  plans: PackageData[];
}
const formatDuration = (duration: number): string => {
  return `${duration} day${duration !== 1 ? 's' : ''}`;
};
const groupPlansByValidity = (plans: PackageData[]): GroupedPlan[] => {
  const grouped = new Map<number, PackageData[]>();

  plans.forEach((plan) => {
    const duration = plan.duration || 1;
    if (!grouped.has(duration)) {
      grouped.set(duration, []);
    }
    grouped.get(duration)!.push(plan);
  });

  const sorted: GroupedPlan[] = Array.from(grouped.entries())
    .sort(([durationA], [durationB]) => durationA - durationB)
    .map(([duration, plansList]) => ({
      duration,
      durationLabel: formatDuration(duration),
      plans: plansList.sort((a, b) => (a.volume || 0) - (b.volume || 0)),
    }));

  return sorted;
};
const formatDataAmount = (volumeUnits: number): string => {
  const gb = volumeUnits / 102400;
  if (gb >= 1) {
    return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
  }
  const mb = volumeUnits / 100;
  return `${mb % 1 === 0 ? mb : mb.toFixed(1)} MB`;
};
const formatPrice = (priceCents: number): string => {
  return `$${(priceCents / 100).toFixed(2)}`;
};

export function PlansGroupedByValidity({
  plans,
  onSelectPlan,
}: PlansGroupedByValidityProps) {
  const groupedPlans = useMemo(() => groupPlansByValidity(plans), [plans]);

  if (groupedPlans.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const groupVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const planVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      {groupedPlans.map((group) => (
        <motion.div
          key={group.duration}
          variants={groupVariants}
          className="space-y-4"
        >
          {/* Duration Header */}
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
              {group.durationLabel}
            </h3>
            <div className="flex-1 h-px bg-linear-to-r from-gray-300 to-transparent" />
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.plans.map((plan) => (
              <motion.div
                key={plan.packageCode}
                variants={planVariants}
                className="group"
              >
                <button
                  onClick={() => onSelectPlan(plan)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Data Amount */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-gray-600">
                        {formatDataAmount(plan.volume || 0)}
                      </span>
                    </div>

                    {/* Right: Price */}
                    <div className="text-right">
                      <span className="text-base md:text-lg font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">USD</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 my-3" />

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{plan.speed || '3G/4G/5G'}</span>
                    <span className="text-primary-700 font-semibold group-hover:text-primary-800">
                      Choose Plan →
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

