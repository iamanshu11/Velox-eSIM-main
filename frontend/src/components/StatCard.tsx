"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: "blue" | "green" | "purple" | "amber" | "rose" | "indigo";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorVariants = {
  blue: "from-primary-50 to-primary-100 border-primary-200 text-primary-900 text-primary-700",
  green:
    "from-green-50 to-green-100 border-green-200 text-green-900 text-green-600",
  purple:
    "from-purple-50 to-purple-100 border-purple-200 text-purple-900 text-purple-600",
  amber:
    "from-amber-50 to-amber-100 border-amber-200 text-amber-900 text-amber-600",
  rose: "from-rose-50 to-rose-100 border-rose-200 text-rose-900 text-rose-600",
  indigo:
    "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900 text-indigo-600",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  loading = false,
  onClick,
  className = "",
}: StatCardProps) {
  const colorClass = colorVariants[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: onClick ? -4 : 0 }}
      onClick={onClick}
      className={`bg-linear-to-br ${colorClass} border rounded-xl p-6 hover:shadow-md transition-all ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 opacity-70`}>
            {title}
          </p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg opacity-20`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-current opacity-20 rounded animate-pulse w-24" />
          <div className="h-4 bg-current opacity-10 rounded animate-pulse w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl md:text-4xl font-bold">{value}</p>
          </div>

          {/* Subtitle or Trend */}
          {trend ? (
            <div className="flex items-center gap-1 text-sm font-medium">
              <span className={trend.direction === "up" ? "text-green-600" : "text-red-600"}>
                {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="opacity-70">vs last month</span>
            </div>
          ) : subtitle ? (
            <p className="text-sm opacity-75">{subtitle}</p>
          ) : null}
        </>
      )}
    </motion.div>
  );
}

