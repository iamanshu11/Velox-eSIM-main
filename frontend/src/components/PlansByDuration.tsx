'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Database, Zap, TrendingUp } from 'lucide-react';
import Button from './Button';

interface Operator {
  operatorName: string;
  networkType: string;
}

interface Plan {
  id: string;
  packageCode: string;
  name: string;
  volume: number;
  duration: number;
  durationUnit: string;
  price: number;
  wholesalePrice?: number;
  speed: string;
  operatorList: Operator[];
  description?: string;
  fupPolicy?: string;
}

interface GroupedPlans {
  [duration: number]: Plan[];
}

interface PlansByDurationProps {
  plans: Plan[];
  onSelectPlan?: (plan: Plan) => void;
}

export function PlansByDuration({ plans, onSelectPlan }: PlansByDurationProps) {
  const groupedPlans = useMemo(() => {
    const grouped: GroupedPlans = {};
    
    plans.forEach(plan => {
      const durationKey = plan.duration;
      if (!grouped[durationKey]) {
        grouped[durationKey] = [];
      }
      grouped[durationKey].push(plan);
    });
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .reduce((acc, duration) => {
        acc[duration] = grouped[duration].sort((a, b) => a.volume - b.volume);
        return acc;
      }, {} as GroupedPlans);
  }, [plans]);

  const durations = Object.keys(groupedPlans).map(Number);

  if (durations.length === 0) {
    return null;
  }

  const formatPrice = (priceInCents: number): string => {
    const dollars = Math.floor(priceInCents / 100);
    const cents = priceInCents % 100;
    return `$${dollars}.${cents.toString().padStart(2, '0')}`;
  };

  const formatDataAmount = (volumeMB: number): string => {
    if (volumeMB >= 1024) {
      return `${(volumeMB / 1024).toFixed(1)} GB`;
    }
    return `${volumeMB} MB`;
  };

  const getDurationLabel = (duration: number, unit: string = 'day'): string => {
    const unitLabel = duration !== 1 ? `${unit}s` : unit;
    return `${duration} ${unitLabel}`;
  };

  const isPopular = (duration: number): boolean => {
    return duration === 7 || duration === 30;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0 }}
      variants={containerVariants}
      className="space-y-20"
    >
      {durations.map((duration) => {
        const plansForDuration = groupedPlans[duration];
        const popular = isPopular(duration);
        const unitLabel = plansForDuration[0]?.durationUnit || 'day';

        return (
          <motion.div
            key={duration}
            variants={sectionVariants}
            className="relative"
          >
            {/* Section Header */}
            <div className="mb-12 flex items-end justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="text-3xl md:text-4xl font-black text-gray-900">
                      {getDurationLabel(duration, unitLabel)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 font-semibold">
                      {plansForDuration.length} plan{plansForDuration.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
              </div>

              {/* Popular Badge */}
              {popular && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-primary-50 to-primary-100 rounded-full border border-primary-200"
                >
                  <TrendingUp className="w-4 h-4 text-primary-700" />
                  <span className="text-sm font-black text-primary-800 uppercase tracking-wide">
                    {duration === 30 ? 'Most Popular' : 'Popular'}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Table Header - Desktop Only */}
              <div className="hidden md:grid gap-0 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-100">
                <div className="px-8 py-6 flex items-center gap-3 col-span-1 min-w-max">
                  <Database className="w-5 h-5 text-gray-600" />
                  <span className="font-bold text-gray-900 text-sm uppercase tracking-wider">Data</span>
                </div>
                <div className="px-8 py-6 font-bold text-gray-900 text-sm uppercase tracking-wider col-span-1 min-w-max">Speed</div>
                <div className="px-8 py-6 font-bold text-gray-900 text-sm uppercase tracking-wider col-span-1 min-w-max">Provider</div>
                <div className="px-8 py-6 font-bold text-gray-900 text-sm uppercase tracking-wider col-span-1 min-w-max">Price</div>
                <div className="px-8 py-6 font-bold text-gray-900 text-sm uppercase tracking-wider col-span-1 min-w-max">Action</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {plansForDuration.map((plan, idx) => (
                  <motion.div
                    key={plan.packageCode}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-8 md:p-0 grid md:grid-cols-5 gap-6 md:gap-0 items-center hover:bg-primary-50/30 transition-colors duration-200 group"
                  >
                    {/* Data Amount */}
                    <div className="md:px-8 md:py-6 flex flex-col md:block">
                      <span className="md:hidden text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Data</span>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
                          <Database className="w-5 h-5 text-primary-700" />
                        </div>
                        <span className="text-lg md:text-base font-bold text-gray-900">
                          {formatDataAmount(plan.volume)}
                        </span>
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="md:px-8 md:py-6 flex flex-col md:block">
                      <span className="md:hidden text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Speed</span>
                      <span className="text-sm md:text-base font-semibold text-gray-700">
                        {plan.speed || '4G LTE'}
                      </span>
                    </div>

                    {/* Provider(s) */}
                    <div className="md:px-8 md:py-6 flex flex-col md:block">
                      <span className="md:hidden text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Provider</span>
                      <div className="space-y-1.5">
                        {plan.operatorList && plan.operatorList.length > 0 ? (
                          plan.operatorList.slice(0, 2).map((op, i) => (
                            <div key={i} className="text-sm font-semibold text-gray-900">
                              {op.operatorName}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm font-semibold text-gray-900">Local Provider</div>
                        )}
                        {plan.operatorList && plan.operatorList.length > 2 && (
                          <div className="text-xs text-gray-600 font-semibold">
                            +{plan.operatorList.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="md:px-8 md:py-6 flex flex-col md:block">
                      <span className="md:hidden text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Price</span>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary-700 shrink-0" />
                        <span className="text-2xl md:text-lg font-black text-gray-900">
                          {formatPrice(plan.price)}
                        </span>
                      </div>
                      {plan.wholesalePrice && plan.wholesalePrice !== plan.price && (
                        <p className="text-xs text-gray-500 line-through mt-1">
                          {formatPrice(plan.wholesalePrice)}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="md:px-8 md:py-6">
                      <Button 
                        onClick={() => onSelectPlan?.(plan)}
                        className="w-full md:w-auto bg-primary-700 hover:bg-primary-800 text-white font-semibold transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-600/20"
                      >
                        Select
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* FUP Info - if available */}
            {plansForDuration[0]?.fupPolicy && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                className="mt-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200"
              >
                <p className="text-sm text-yellow-900 font-semibold">
                  <span className="font-black">Fair Usage Policy:</span> {plansForDuration[0].fupPolicy}
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

