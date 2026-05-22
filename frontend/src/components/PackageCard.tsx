'use client';

import { motion } from 'framer-motion';
import { Database, Zap, Clock, DollarSign } from 'lucide-react';
import Button from './Button';
import { formatVolume, formatPrice, formatDuration } from '@/utils/dataConversion';

export interface PackageData {
  id: string;
  packageCode: string;
  name: string;
  volume: number;
  duration: number;
  durationUnit: string;
  price: number;
  wholesalePrice?: number;
  speed?: string;
  operatorName?: string;
  country?: string;
  description?: string;
  dataAmount?: number;
  validity?: number;
}

interface PackageCardProps {
  package: PackageData;
  onSelect?: (pkg: PackageData) => void;
  isSelected?: boolean;
  showWholesalePrice?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}
export default function PackageCard({
  package: pkg,
  onSelect,
  isSelected = false,
  showWholesalePrice = false,
  variant = 'default',
}: PackageCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(pkg);
    }
  };

  const volumeDisplay = formatVolume(pkg.volume);
  const priceDisplay = formatPrice(pkg.price);
  const wholesalePriceDisplay = showWholesalePrice && pkg.wholesalePrice 
    ? formatPrice(pkg.wholesalePrice)
    : null;
  const durationDisplay = formatDuration(pkg.duration, pkg.durationUnit);

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-primary-600 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-primary-400'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {volumeDisplay}
            </p>
            <p className="text-xs text-gray-600">{durationDisplay}</p>
          </div>
          <p className="text-lg font-bold text-gray-900 shrink-0">{priceDisplay}</p>
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -4 }}
        className="h-full bg-linear-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-2xl p-6 cursor-pointer transition-all hover:border-primary-400 hover:shadow-lg"
        onClick={handleClick}
      >
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
            {pkg.country && (
              <p className="text-sm text-gray-600">{pkg.country}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Volume */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-primary-700" />
                <span className="text-xs font-medium text-gray-600">Data</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{volumeDisplay}</p>
            </div>

            {/* Duration */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-gray-600">Validity</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{durationDisplay}</p>
            </div>
          </div>

          {/* Speed & Operator */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            {pkg.speed && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">{pkg.speed}</span>
              </div>
            )}
            {pkg.operatorName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">Provider:</span> {pkg.operatorName}
                </span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-600">Price</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{priceDisplay}</p>
                {wholesalePriceDisplay && (
                  <p className="text-xs text-gray-500 line-through">
                    {wholesalePriceDisplay}
                  </p>
                )}
              </div>
            </div>
            {pkg.description && (
              <p className="text-xs text-gray-600 italic">{pkg.description}</p>
            )}
          </div>

          {/* Select Button */}
          <Button
            onClick={handleClick}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2 transition-colors"
          >
            Choose Plan
          </Button>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="p-4 md:p-6 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-md transition-all group cursor-pointer"
      onClick={handleClick}
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
          {pkg.description && (
            <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Volume */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Data</p>
              <p className="text-lg font-bold text-gray-900">{volumeDisplay}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Validity</p>
              <p className="text-lg font-bold text-gray-900">{durationDisplay}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Price</p>
              <p className="text-lg font-bold text-gray-900">{priceDisplay}</p>
              {wholesalePriceDisplay && (
                <p className="text-xs text-gray-500 line-through">
                  {wholesalePriceDisplay}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {pkg.speed && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                <Zap className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-gray-700">{pkg.speed}</span>
              </div>
            )}
            {pkg.operatorName && (
              <span className="text-xs text-gray-600">via {pkg.operatorName}</span>
            )}
          </div>
          <Button
            onClick={handleClick}
            className="bg-primary-700 hover:bg-primary-800 text-white font-semibold px-4 py-2 text-sm"
          >
            Select
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

