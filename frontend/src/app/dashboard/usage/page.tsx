'use client';

import CountryFlagIcon from '@/components/CountryFlagIcon';
import Button from '@/components/Button';
import { apiClient } from '@/lib/apiClient';
import { BackendApiResponse } from '@/types/api';
import logger from '@/lib/logger';
import { motion } from 'framer-motion';
import { AlertCircle, Globe, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface UsageData {
  id: string;
  country: string;
  countryCode: string;
  dataUsed: number;
  dataTotal: number;
  usagePercent: number;
  daysRemaining: number;
  lastUsedAt: string;
}

interface UsageStats {
  totalDataUsed: number;
  totalDataAvailable: number;
  averageDailyUsage: number;
  projectedExhaustionDays: number;
  activeESIMs: number;
  dailyUsageHistory: Array<{
    date: string;
    usage: number;
  }>;
  countries: UsageData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const StatCard = ({ icon: Icon, label, value, unit, color }: any) => (
  <motion.div
    variants={itemVariants}
    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">
      {typeof value === 'number' ? value.toFixed(1) : value}
      <span className="text-sm font-medium text-gray-600 ml-1">{unit}</span>
    </p>
  </motion.div>
);

export default function UsageDashboardPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const esimRes = await apiClient.get<BackendApiResponse<{ data: any[] }>>('/orders/dashboard/active-esims?limit=100');
      const activeESIMs = esimRes?.data?.data || [];

      const countries = activeESIMs.map((esim: any) => {
        const mainPackage = esim.packages?.[0];
        const dataUsed = esim.totalVolume ? esim.usedVolume || 0 : 0;
        const dataTotal = esim.totalVolume || 0;
        const usagePercent = dataTotal > 0 ? (dataUsed / dataTotal) * 100 : 0;
        const daysRemaining = esim.daysRemaining || 0;

        return {
          id: esim.id,
          country: mainPackage?.locationName || 'Global',
          countryCode: mainPackage?.locationCode || 'Global',
          dataUsed,
          dataTotal,
          usagePercent,
          daysRemaining,
          lastUsedAt: esim.lastUsedAt || new Date().toISOString(),
        };
      });

      const totalDataUsed = countries.reduce((sum: number, c: UsageData) => sum + c.dataUsed, 0);
      const totalDataAvailable = countries.reduce((sum: number, c: UsageData) => sum + c.dataTotal, 0);
      
      const avgDailyUsage = totalDataUsed > 0 ? totalDataUsed / Math.max(1, 30) : 0;
      const projectedDays = avgDailyUsage > 0 ? Math.ceil((totalDataAvailable - totalDataUsed) / avgDailyUsage) : 0;
      const dailyUsageHistory = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyUsageHistory.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          usage: Math.round(avgDailyUsage * 100) / 100,
        });
      }

      setStats({
        totalDataUsed,
        totalDataAvailable,
        averageDailyUsage: avgDailyUsage,
        projectedExhaustionDays: projectedDays,
        activeESIMs: countries.length,
        dailyUsageHistory,
        countries: countries.sort((a: UsageData, b: UsageData) => b.usagePercent - a.usagePercent),
      });
    } catch (err) {
      logger.error('Failed to fetch usage data', err);
      setError('Failed to load usage data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.activeESIMs === 0) {
    return (
      <div className="text-center py-20 bg-primary-50 rounded-xl border-2 border-dashed border-primary-200">
        <Zap className="w-16 h-16 text-primary-300 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-950 mb-2">No Active eSIMs</h2>
        <p className="text-gray-700 mb-8">
          Purchase an eSIM to start tracking your data usage
        </p>
        <Link href="/esims">
          <Button variant="primary" size="lg">
            Browse Plans
          </Button>
        </Link>
      </div>
    );
  }

  const pieData = stats.countries.map(c => ({
    name: c.country,
    value: c.dataUsed,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black text-gray-950 flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          Usage Dashboard
        </h1>
        <p className="text-gray-600">Track your eSIM data consumption across all countries</p>
      </motion.div>

      {/* Key Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          icon={Zap}
          label="Total Data Used"
          value={stats.totalDataUsed}
          unit="MB"
          color="bg-primary-600"
        />
        <StatCard
          icon={Globe}
          label="Data Available"
          value={stats.totalDataAvailable}
          unit="MB"
          color="bg-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Daily Avg Usage"
          value={stats.averageDailyUsage}
          unit="MB/day"
          color="bg-yellow-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Projected Exhaustion"
          value={stats.projectedExhaustionDays}
          unit="days"
          color="bg-red-500"
        />
      </motion.div>

      {/* Overall Usage Bar */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h2 className="text-lg font-black text-gray-950 mb-4">Overall Data Usage</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {stats.totalDataUsed.toFixed(0)} MB used of {stats.totalDataAvailable.toFixed(0)} MB
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {((stats.totalDataUsed / stats.totalDataAvailable) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (stats.totalDataUsed / stats.totalDataAvailable) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-linear-to-r from-primary-700 to-primary-600 h-full rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Trend */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-lg font-black text-gray-950 mb-4">Daily Usage (30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailyUsageHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Data by Country */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-lg font-black text-gray-950 mb-4">Usage by Country</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => `${value} MB`}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Country Breakdown */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-black text-gray-950">Usage Breakdown by Country</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {stats.countries.map((country, idx) => (
            <motion.div
              key={country.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 mb-3">
                <CountryFlagIcon countryCode={country.countryCode} size={32} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{country.country}</h3>
                  <p className="text-sm text-gray-500">
                    {country.daysRemaining} days remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {country.dataUsed.toFixed(0)} MB used
                  </p>
                  <p className="text-xs text-gray-500">
                    of {country.dataTotal.toFixed(0)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, country.usagePercent)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                    className={`h-full rounded-full transition-colors ${
                      country.usagePercent > 75
                        ? 'bg-red-500'
                        : country.usagePercent > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                  {country.usagePercent.toFixed(0)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

