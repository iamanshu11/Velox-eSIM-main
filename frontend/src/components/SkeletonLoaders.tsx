"use client";

import React from "react";
import { motion } from "framer-motion";
const shimmerStyle = `
  @keyframes shimmer {
    0% {
      backgroundPosition: 200% 0;
    }
    100% {
      backgroundPosition: -200% 0;
    }
  }
`;
if (typeof document !== "undefined") {
  const styleId = "shimmer-animation-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = shimmerStyle;
    document.head.appendChild(style);
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const skeletonItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};
export const BalanceCardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-linear-to-r from-amber-400 via-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative"
  >
    <motion.div
      className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
      animate={{
        backgroundPosition: ["200% 0", "-200% 0"],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundSize: "200% 100%",
        opacity: 0.1,
      }}
    />
    <div className="relative">
      <p className="text-amber-100 text-sm font-semibold uppercase tracking-wider mb-2">
        Current Balance
      </p>
      <div className="h-12 bg-white/20 rounded w-40 mb-4"></div>
      <div className="h-4 bg-white/20 rounded w-32"></div>
    </div>
  </motion.div>
);
export const QuickStatsSkeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="grid grid-cols-2 md:grid-cols-5 gap-4"
  >
    {[
      { from: "from-primary-50", to: "to-primary-100", border: "border-primary-200" },
      { from: "from-green-50", to: "to-green-100", border: "border-green-200" },
      {
        from: "from-purple-50",
        to: "to-purple-100",
        border: "border-purple-200",
      },
      {
        from: "from-amber-50",
        to: "to-amber-100",
        border: "border-amber-200",
      },
      {
        from: "from-primary-50",
        to: "to-primary-200",
        border: "border-primary-200",
      },
    ].map((colors, idx) => (
      <motion.div
        key={idx}
        variants={skeletonItem}
        className={`bg-linear-to-br ${colors.from} ${colors.to} border ${colors.border} rounded-xl p-4 overflow-hidden relative`}
      >
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
          animate={{
            backgroundPosition: ["200% 0", "-200% 0"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: "200% 100%",
            opacity: 0.15,
          }}
        />
        <div className="relative">
          <div className="h-3 bg-current bg-opacity-20 rounded w-20 mb-3"></div>
          <div className="h-6 bg-current bg-opacity-20 rounded w-24 mb-2"></div>
          <div className="h-2 bg-current bg-opacity-15 rounded w-16"></div>
        </div>
      </motion.div>
    ))}
  </motion.div>
);
export const ChartCardSkeleton: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm overflow-hidden relative"
  >
    <motion.div
      className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
      animate={{
        backgroundPosition: ["200% 0", "-200% 0"],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundSize: "200% 100%",
        opacity: 0.1,
      }}
    />
    <div className="relative space-y-4">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>

      {/* Chart grid placeholder */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 bg-gray-150 rounded flex-1 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
                animate={{
                  backgroundPosition: ["200% 0", "-200% 0"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.1,
                }}
                style={{
                  backgroundSize: "200% 100%",
                  opacity: 0.2,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);
export const OverviewChartsSkeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="space-y-4"
  >
    <motion.div variants={skeletonItem} className="h-8 bg-gray-200 rounded w-1/4 mb-6"></motion.div>
    <motion.div
      variants={staggerContainer}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      {[0, 0.1].map((delay) => (
        <motion.div key={delay} variants={skeletonItem}>
          <ChartCardSkeleton delay={delay} />
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);
export const AccountCardsSkeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="space-y-6"
  >
    <motion.div variants={skeletonItem} className="h-8 bg-gray-200 rounded w-1/4 mb-6"></motion.div>
    <motion.div
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {[
        { bg: "from-primary-700 to-primary-900", icon: "💰" },
        { bg: "from-purple-500 to-purple-700", icon: "📱" },
        { bg: "from-green-500 to-green-700", icon: "🌍" },
      ].map((card, idx) => (
        <motion.div
          key={idx}
          variants={skeletonItem}
          className={`relative overflow-hidden bg-linear-to-br ${card.bg} rounded-2xl p-8 text-white shadow-lg`}
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
            animate={{
              backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 100%",
              opacity: 0.15,
            }}
          />
          <div className="relative">
            <div className="h-4 bg-white/20 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-white/20 rounded w-1/2 mb-6"></div>
            <div className="h-3 bg-white/20 rounded w-2/3"></div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);
export const ESIMProfilesTableSkeleton: React.FC<{ count?: number }> = ({
  count = 5,
}) => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
  >
    <div className="grid grid-cols-1 gap-3 p-6">
      {Array.from({ length: count }).map((_, idx) => (
        <motion.div
          key={idx}
          variants={skeletonItem}
          className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden relative group"
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
            animate={{
              backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: idx * 0.05,
            }}
            style={{
              backgroundSize: "200% 100%",
              opacity: 0.2,
            }}
          />
          <div className="relative flex-1 mb-4 md:mb-0 w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-5 bg-gray-300 rounded w-24"></div>
              <div className="h-6 bg-gray-300 rounded-full w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-40"></div>
              <div className="flex gap-6">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
          <div className="h-8 bg-gray-300 rounded px-4 w-20"></div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);
export const LocationsGridSkeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="space-y-6"
  >
    <motion.div variants={skeletonItem} className="h-8 bg-gray-200 rounded w-1/4 mb-6"></motion.div>
    <motion.div
      variants={staggerContainer}
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      {Array.from({ length: 12 }).map((_, idx) => (
        <motion.div
          key={idx}
          variants={skeletonItem}
          className="bg-white border border-gray-200 rounded-lg p-4 text-center overflow-hidden relative"
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
            animate={{
              backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: idx * 0.03,
            }}
            style={{
              backgroundSize: "200% 100%",
              opacity: 0.15,
            }}
          />
          <div className="relative">
            <div className="h-10 bg-gray-200 rounded mb-3 w-10 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-150 rounded w-12 mx-auto"></div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);
export const TopLocationsSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
    <LocationsGridSkeleton />
  </motion.div>
);
export const NewESIMTop10Skeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="space-y-6"
  >
    <motion.div variants={skeletonItem} className="h-8 bg-gray-200 rounded w-1/3 mb-6"></motion.div>
    <motion.div
      variants={staggerContainer}
      className="grid grid-cols-2 md:grid-cols-5 gap-4"
    >
      {Array.from({ length: 10 }).map((_, idx) => (
        <motion.div
          key={idx}
          variants={skeletonItem}
          className="bg-linear-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center overflow-hidden relative"
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
            animate={{
              backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: idx * 0.04,
            }}
            style={{
              backgroundSize: "200% 100%",
              opacity: 0.15,
            }}
          />
          <div className="relative">
            <div className="h-8 bg-green-200 rounded mb-3 w-8 mx-auto"></div>
            <div className="h-4 bg-green-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-6 bg-green-300 rounded w-12 mx-auto mb-1"></div>
            <div className="h-3 bg-green-200 rounded w-14 mx-auto"></div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);
export const RecentOrdersTableSkeleton: React.FC<{ count?: number }> = ({
  count = 5,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
  >
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: count }).map((_, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-primary-50 transition-colors"
              style={{
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
                backgroundSize: "200% 100%",
                animation: `shimmer 2s infinite`,
                animationDelay: `${rowIdx * 0.05}s`,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((colIdx) => (
                <td key={colIdx} className="px-6 py-4">
                  <div
                    className={`h-4 bg-gray-200 rounded ${
                      colIdx === 1 ? "w-24" : colIdx === 6 ? "w-16" : "w-20"
                    }`}
                  ></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);
export const UserStatsSkeletonLoader: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="space-y-6"
  >
    {/* Header */}
    <motion.div variants={skeletonItem} className="space-y-2">
      <div className="h-8 bg-gray-300 rounded w-48"></div>
      <div className="h-4 bg-gray-200 rounded w-80"></div>
    </motion.div>

    {/* Stats Cards */}
    <motion.div
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {["blue", "green", "purple"].map((color, idx) => (
        <motion.div
          key={idx}
          variants={skeletonItem}
          className={`bg-linear-to-br from-${color}-50 to-${color}-100 border border-${color}-200 rounded-xl p-6 overflow-hidden relative`}
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
            animate={{
              backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: idx * 0.1,
            }}
            style={{
              backgroundSize: "200% 100%",
              opacity: 0.15,
            }}
          />
          <div className="relative space-y-3">
            <div className="h-3 bg-gray-300 rounded w-20"></div>
            <div className="h-8 bg-gray-300 rounded w-24"></div>
            <div className="h-2 bg-gray-200 rounded w-32"></div>
          </div>
        </motion.div>
      ))}
    </motion.div>

    {/* Role Distribution */}
    <motion.div
      variants={skeletonItem}
      className="bg-white border border-gray-200 rounded-xl p-6 overflow-hidden relative"
    >
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
        animate={{
          backgroundPosition: ["200% 0", "-200% 0"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundSize: "200% 100%",
          opacity: 0.1,
        }}
      />
      <div className="relative space-y-4">
        <div className="h-6 bg-gray-300 rounded w-32"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-gray-100 rounded-lg space-y-2">
              <div className="h-3 bg-gray-300 rounded w-16"></div>
              <div className="h-6 bg-gray-300 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  </motion.div>
);


