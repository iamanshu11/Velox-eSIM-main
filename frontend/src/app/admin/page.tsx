"use client";

import CountryFlagIcon from "@/components/CountryFlagIcon";
import {
  BalanceCardSkeleton,
  OverviewChartsSkeleton,
  QuickStatsSkeleton,
} from "@/components/SkeletonLoaders";
import { useGetDashboardMetricsQuery, useGetPurchaseOverviewQuery, useGetActiveESIMOverviewQuery, useGetTopPackagesQuery, useGetRecentPurchasesQuery } from '@/store/slices/analyticsSlice';
import { useGetCredentialsStatusQuery } from '@/store/slices/credentialsSlice';
import { useGetDashboardAccountQuery } from '@/store/slices/esimSlice';
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  ShoppingCart,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface OverviewPoint {
  name: string;
  value: number;
  amount?: number;
  code?: string;
}

interface TopPackageItem {
  code: string;
  name: string;
  location: string;
  countryCode: string;
  countryName: string;
  volume: number;
  duration: number;
  sellingPrice: number;
  price: number;
  purchaseCount: number;
  totalRevenue: number;
  locationsCount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TopPackageItem | null>(null);

  const commonQueryOptions = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  } as const;

  const { data: credentialsStatus, isLoading: credentialsLoading } = useGetCredentialsStatusQuery(undefined, commonQueryOptions);
  const { data: metrics = { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, growth: 0 }, isLoading: metricsLoading, refetch: refetchMetrics } = useGetDashboardMetricsQuery(undefined, commonQueryOptions);
  const { data: dashboardData, isLoading: dashboardAccountLoading, refetch: refetchDashboardAccount } = useGetDashboardAccountQuery(undefined, commonQueryOptions);
  const { data: purchaseOverviewRaw = [], isLoading: purchaseOverviewLoading, refetch: refetchPurchaseOverview } = useGetPurchaseOverviewQuery(undefined, commonQueryOptions);
  const { data: activeESIMOverviewRaw = [], isLoading: activeESIMOverviewLoading, refetch: refetchActiveESIMOverview } = useGetActiveESIMOverviewQuery(undefined, commonQueryOptions);
  const { data: topPackagesData = [], isLoading: topPackagesLoading, refetch: refetchTopPackages } = useGetTopPackagesQuery(undefined, commonQueryOptions);
  const { data: recentPurchasesData = [], isLoading: recentPurchasesLoading, refetch: refetchRecentPurchases } = useGetRecentPurchasesQuery(undefined, commonQueryOptions);

  const loading = credentialsLoading || metricsLoading || dashboardAccountLoading || purchaseOverviewLoading || activeESIMOverviewLoading || topPackagesLoading || recentPurchasesLoading;

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (credentialsStatus && !credentialsStatus.isConfigured) {
      router.push('/admin/setup');
    }
  }, [credentialsStatus, router]);

  const purchaseOverviewData = useMemo(
    () =>
      Array.isArray(purchaseOverviewRaw)
        ? purchaseOverviewRaw.map((item) => ({
            name: item.name || item.label || 'Unknown',
            value: Number(item.value ?? item.count ?? 0),
            amount: Number(item.amount ?? item.count ?? item.value ?? 0),
          }))
        : [],
    [purchaseOverviewRaw]
  );

  const activeESIMOverviewData = useMemo(
    () =>
      Array.isArray(activeESIMOverviewRaw)
        ? activeESIMOverviewRaw.map((item) => ({
            name: item.name || item.status || 'Unknown',
            value: Number(item.value ?? item.count ?? 0),
            amount: Number(item.count ?? item.value ?? 0),
          }))
        : [],
    [activeESIMOverviewRaw]
  );

  const refreshDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchMetrics(),
        refetchDashboardAccount(),
        refetchPurchaseOverview(),
        refetchActiveESIMOverview(),
        refetchTopPackages(),
        refetchRecentPurchases(),
      ]);
      setLastSyncedAt(new Date().toISOString());
    } finally {
      setIsRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatMoney = (value: number) => `$${value.toFixed(2)}`;

  const growthValue = Number.isFinite(Number(metrics.growth))
    ? Number(metrics.growth)
    : 0;

  const formatRelativeTime = (iso: string) => {
    if (!iso) return "Not synced yet";
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes === 1) return "1 minute ago";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: OverviewPoint }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
          <p className="font-bold text-secondary-900">{data.name}</p>
          <p className="text-sm text-primary-700">Orders: {data.value}</p>
          {data.amount && <p className="text-sm text-primary-600">Revenue: ${data.amount}</p>}
        </div>
      );
    }
    return null;
  };

  const metricCards = [
    {
      href: "/admin/balance",
      title: "Total Revenue",
      value: formatMoney(metrics.totalRevenue),
      description: "From all orders",
      tone: "blue",
    },
    {
      href: "/admin/orders",
      title: "Total Orders",
      value: metrics.totalOrders,
      description: "Active eSIM orders",
      tone: "green",
    },
    {
      href: "/admin/users",
      title: "Active Customers",
      value: metrics.totalCustomers,
      description: "Customers with paid orders",
      tone: "purple",
    },
    {
      href: "/admin/esims",
      title: "Active eSIMs",
      value: metrics.activeEsims ?? 0,
      description: "Live eSIM profiles",
      tone: "amber",
    },
    {
      href: "/admin/analytics",
      title: "Growth Rate",
      value: `${growthValue.toFixed(2)}%`,
      description: "Month-over-month change",
      tone: "cyan",
    },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Premium Header with Integrated Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Background gradient accent */}
        <div className="absolute inset-0 rounded-3xl bg-linear-to-r from-primary-900/10 via-primary-700/5 to-neutral-200/40" />
        
        <div className="relative rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Welcome Section */}
            <div className="md:col-span-2">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="mb-3 text-4xl font-bold text-secondary-900 md:text-5xl">
                  {getGreeting()}
                </h1>
                <p className="mb-4 text-lg font-medium text-secondary-600">
                  Welcome back to your eSIM dashboard
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                    <Calendar className="w-4 h-4 text-primary-700" />
                    <span className="text-sm font-semibold text-primary-900">{currentTime}</span>
                  </div>
                  <div className="rounded-lg border border-primary-200 bg-linear-to-r from-primary-50 to-neutral-100 px-4 py-2">
                    <p className="text-sm font-semibold text-primary-900">All Systems Running</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-secondary-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isRefreshing ? "Syncing dashboard..." : `Last synced ${formatRelativeTime(lastSyncedAt)}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={refreshDashboardData}
                    className="inline-flex items-center gap-2 rounded-full border border-primary-700 px-4 py-2 font-semibold text-primary-700 transition-colors hover:bg-primary-700 hover:text-white cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh data
                  </button>
                  <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-4 py-2 font-semibold text-white! transition-colors hover:bg-primary-800"
                  >
                    View recent orders
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Balance Card */}
            <div className="flex flex-col gap-4 justify-between">
              {/* Account Balance Card - Prominent Display */}
              {dashboardAccountLoading ? (
                <BalanceCardSkeleton />
              ) : (
                <div className="rounded-2xl bg-linear-to-r from-primary-900 via-primary-800 to-primary-700 p-6 text-white shadow-lg">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-100">Current Balance</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-white">{dashboardData?.balance?.balance?.toFixed(2) || "0.00"}</p>
                    <span className="text-2xl font-medium text-primary-100">{dashboardData?.balance?.currency || "USD"}</span>
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-xs text-primary-100">
                    <Clock className="w-4 h-4" />
                    Last updated: {dashboardData?.balance?.lastUpdatedTime ? new Date(dashboardData.balance.lastUpdatedTime).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Summary Bar - Real Data */}
      {loading ? (
        <QuickStatsSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {metricCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              aria-label={`Open ${card.title}`}
              className="group block rounded-xl border border-neutral-200 bg-linear-to-br from-white to-neutral-100 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-700">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-secondary-600">
                {card.description}
              </p>
            </Link>
          ))}
        </motion.div>
      )}

      {/* Overview Section - Purchase & Active eSIM Overview with Pie Charts */}
      {loading ? (
        <OverviewChartsSkeleton />
      ) : (
        <>
          {/* Purchase Overview & Active eSIM Overview - Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Purchase Overview */}
            {purchaseOverviewData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-6 text-2xl font-bold text-secondary-900">Purchase Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={purchaseOverviewData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#43A1F0" 
                      strokeWidth={2}
                      dot={{ fill: "#43A1F0", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Active eSIM Overview */}
            {activeESIMOverviewData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-6 text-2xl font-bold text-secondary-900">Active eSIM Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={activeESIMOverviewData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#fff", 
                        border: "1px solid #e5e7eb", 
                        borderRadius: "8px",
                        padding: "12px"
                      }}
                      formatter={(value, name) => {
                        if (name === 'value') return [`${value} eSIMs`, 'Count'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2a7dd4" 
                      strokeWidth={2}
                      dot={{ fill: "#2a7dd4", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Top Purchased Packages */}
          {topPackagesData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div>
                <h2 className="mb-2 flex items-center gap-3 text-3xl font-bold text-secondary-900">
                  <Smartphone className="h-8 w-8 text-primary-700" />
                  Top Purchased Packages
                </h2>
                <p className="text-sm text-secondary-600">Real paid orders ranked by volume and revenue</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {topPackagesData.map((pkg, idx) => (
                  <motion.div
                    key={`${pkg.code}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5, shadow: "lg" }}
                    onClick={() => setSelectedPackage(pkg)}
                    className="group cursor-pointer rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-secondary-900 group-hover:text-primary-700">
                          {pkg.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-secondary-500">
                          {pkg.countryName} • {pkg.code}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        #{idx + 1}
                      </div>
                    </div>
                    
                    <div className="mb-4 space-y-2 border-b border-neutral-200 pb-4">
                      <div className="flex items-center gap-2 text-xs text-secondary-600">
                        <span className="font-bold text-secondary-900">{pkg.volume} MB</span>
                        <span>•</span>
                        <span>{pkg.duration} days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-secondary-900">{formatMoney(pkg.sellingPrice)}</span>
                        <span className="text-xs line-through text-secondary-500">{formatMoney(pkg.price)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary-600">Purchases</span>
                        <span className="text-lg font-bold text-primary-700">{pkg.purchaseCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary-600">Revenue</span>
                        <span className="text-sm font-bold text-primary-700">{formatMoney(pkg.totalRevenue)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Purchases with Package Details */}
          {recentPurchasesData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="mb-2 flex items-center gap-3 text-3xl font-bold text-secondary-900">
                    <ShoppingCart className="h-8 w-8 text-primary-700" />
                    Recent Paid Orders
                  </h2>
                  <p className="text-sm text-secondary-600">Latest completed orders pulled from real transactions</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-lg transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
                {recentPurchasesData.map((purchase, idx) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    whileHover={{ y: -4, shadow: "lg" }}
                    className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-lg"
                  >
                    {(() => {
                      const statusLower = purchase.status.toLowerCase();
                      const statusLabel = statusLower.includes('completed')
                        ? 'Completed'
                        : statusLower.includes('processing')
                          ? 'Processing'
                          : statusLower.includes('failed')
                            ? 'Failed'
                            : statusLower.includes('active')
                              ? 'Active'
                              : purchase.status;
                      const statusClass = statusLower.includes('completed') || statusLower.includes('active')
                        ? 'bg-green-100 text-green-800'
                        : statusLower.includes('failed')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800';

                      return (
                    <>
                    {/* Header with Location Flag and Status */}
                    <div className="mb-4 flex items-start justify-between border-b border-neutral-200 pb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <CountryFlagIcon countryCode={purchase.countryCode} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-secondary-900">{purchase.countryName}</p>
                          <p className="text-xs text-secondary-500">Order #{purchase.orderNo}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Package Info */}
                    <div className="mb-4 border-b border-neutral-200 pb-4">
                      <p className="text-sm font-bold text-secondary-900 transition group-hover:text-primary-700">{purchase.packageName}</p>
                      <p className="mt-1 font-mono text-xs text-secondary-500">{purchase.packageCode}</p>
                      <div className="mt-2 text-xs text-secondary-600">
                        <span className="font-semibold text-secondary-900">{purchase.volume} MB</span>
                        <span className="mx-1">•</span>
                        <span>{purchase.duration} days</span>
                        <span className="mx-1">•</span>
                        <span>{purchase.quantity}x</span>
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-neutral-100 p-3">
                        <p className="mb-1 text-xs text-secondary-600">Cost</p>
                        <p className="text-lg font-bold text-secondary-900">{formatMoney(purchase.cost)}</p>
                      </div>
                      <div className="bg-primary-50 rounded-lg p-3">
                        <p className="mb-1 text-xs text-secondary-600">Price</p>
                        <p className="text-lg font-bold text-primary-700">{formatMoney(purchase.price)}</p>
                      </div>
                    </div>

                    {/* Profit Highlight */}
                    <div className="mt-3 rounded-lg border border-primary-200 bg-linear-to-r from-primary-50 to-neutral-100 p-3">
                      <p className="mb-1 text-xs text-secondary-600">Profit</p>
                      <p className="text-xl font-bold text-primary-700">{formatMoney(purchase.profit)}</p>
                    </div>
                    </>
                      );
                    })()}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
      
      {/* Package Details Modal */}
      {selectedPackage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedPackage(null)}
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-linear-to-r from-primary-800 to-primary-700 p-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPackage.name}</h2>
                <p className="mt-1 text-sm text-primary-100">Package Code: {selectedPackage.code}</p>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="rounded-full p-2 text-white transition-colors hover:bg-primary-900"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Key Specs */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-linear-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
                  <p className="text-sm text-primary-700 font-semibold mb-2 uppercase">Data Volume</p>
                  <p className="text-3xl font-bold text-primary-900">{selectedPackage.volume}<span className="text-lg ml-1">MB</span></p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-linear-to-br from-neutral-50 to-neutral-100 p-6">
                  <p className="mb-2 text-sm font-semibold uppercase text-secondary-600">Validity</p>
                  <p className="text-3xl font-bold text-secondary-900">{selectedPackage.duration}<span className="ml-1 text-lg">days</span></p>
                </div>
                <div className="rounded-lg border border-primary-200 bg-linear-to-br from-primary-50 to-neutral-100 p-6">
                  <p className="mb-2 text-sm font-semibold uppercase text-primary-700">Price</p>
                  <p className="text-3xl font-bold text-primary-900">${selectedPackage.sellingPrice}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="border-t border-neutral-200 pt-8">
                <h3 className="mb-4 text-xl font-bold text-secondary-900">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="mb-2 text-sm text-secondary-600">Total Purchases</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-bold text-primary-700">{selectedPackage.purchaseCount}</p>
                      <p className="mb-1 text-sm text-secondary-500">purchases</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-secondary-600">Total Revenue Generated</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-bold text-primary-700">${selectedPackage.totalRevenue}</p>
                      <p className="mb-1 text-sm text-secondary-500">revenue</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-secondary-600">Cost per Unit</p>
                    <p className="text-2xl font-bold text-secondary-900">${selectedPackage.price}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-secondary-600">Available in Countries</p>
                    <p className="text-2xl font-bold text-secondary-900">{selectedPackage.locationsCount}</p>
                  </div>
                </div>
              </div>

              {/* Profit Info */}
              <div className="rounded-lg border border-primary-200 bg-linear-to-br from-primary-50 to-neutral-100 p-6">
                <h4 className="mb-4 font-bold text-secondary-900">Profit Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-700">Cost per Unit:</span>
                    <span className="font-bold">${selectedPackage.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-700">Selling Price:</span>
                    <span className="font-bold text-primary-700">${selectedPackage.sellingPrice}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-primary-200 pt-3">
                    <span className="font-semibold text-secondary-700">Profit Margin:</span>
                    <span className="text-lg font-bold text-primary-700">
                      {((selectedPackage.sellingPrice - selectedPackage.price) / selectedPackage.price * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPackage(null)}
                className="w-full rounded-lg bg-primary-700 py-3 font-bold text-white transition-colors hover:bg-primary-800"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}


    </div>
  );
}

