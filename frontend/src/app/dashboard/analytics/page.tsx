'use client';

export const dynamic = 'force-dynamic';

import { apiClient } from '@/lib/apiClient';
import { BackendApiResponse } from '@/types/api';
import { motion } from 'framer-motion';
import { BarChart3, Download, Target, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

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

interface AnalyticsData {
  chartData: Array<{ month: string; amount: number }>;
  stats: {
    totalSpent: number;
    totalOrders: number;
    activeESIMs: number;
    avgOrderValue: number;
    totalProfit: number;
    totalSavings: number;
  };
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<BackendApiResponse<{ data: AnalyticsData }>>('/orders/dashboard/analytics');
      const data = response?.data?.data;

      if (data) {
        setAnalyticsData({
          chartData: data.chartData || [],
          stats: data.stats || {},
        });
      }
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error || 'No analytics data available'}</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Spent',
      value: `$${analyticsData.stats.totalSpent?.toFixed(2) || '0.00'}`,
      change: analyticsData.stats.totalOrders > 0 ? `${analyticsData.stats.totalOrders} orders` : 'No orders',
      positive: true,
      icon: BarChart3,
    },
    {
      label: 'Active eSIMs',
      value: analyticsData.stats.activeESIMs || '0',
      change: '+0%',
      positive: true,
      icon: Target,
    },
    {
      label: 'Avg Order Value',
      value: `$${analyticsData.stats.avgOrderValue?.toFixed(2) || '0.00'}`,
      change: analyticsData.stats.totalOrders > 0 ? '↓' : 'N/A',
      positive: true,
      icon: TrendingUp,
    },
    {
      label: 'Total Profit',
      value: `$${analyticsData.stats.totalProfit?.toFixed(2) || '0.00'}`,
      change: '+0%',
      positive: true,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-950 flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-primary-700" />
              Usage Analytics
            </h1>
            <p className="text-gray-600">Comprehensive insights into your eSIM usage patterns and spending</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    timeRange === range
                      ? 'bg-primary-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-6 h-6 text-primary-700" />
                <span
                  className={`text-sm font-semibold ${
                    stat.positive ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Monthly Spending Chart */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Spending</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="amount" fill="#3b82f6" name="Spending ($)" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Summary */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-linear-to-br from-primary-50 to-indigo-50 rounded-lg border border-primary-200 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-6">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-2">TOTAL ORDERS</p>
            <p className="text-3xl font-bold text-gray-900">{analyticsData.stats.totalOrders}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-2">TOTAL SAVINGS</p>
            <p className="text-3xl font-bold text-green-600">${analyticsData.stats.totalSavings?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-2">TOTAL PROFIT</p>
            <p className="text-3xl font-bold text-primary-700">${analyticsData.stats.totalProfit?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

