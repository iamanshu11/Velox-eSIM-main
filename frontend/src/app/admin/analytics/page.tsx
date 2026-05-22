"use client";

import { apiClient } from "@/lib/apiClient";
import { BackendApiResponse } from "@/types/api";
import { Download, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import logger from "@/lib/logger";

interface Metrics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  activeESIMs: number;
  newOrders?: number;
  newUsers?: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get<BackendApiResponse<Metrics>>(`/analytics/metrics?days=${days}`);
        setMetrics(res?.data || null);
      } catch (error) {
        logger.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [days]);

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                ${(metrics?.totalRevenue || 0 / 100).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics?.totalOrders || 0}
              </p>
              {metrics?.newOrders ? (
                <p className="text-xs text-green-600 mt-1">
                  +{metrics.newOrders} new
                </p>
              ) : null}
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-700" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics?.totalUsers || 0}
              </p>
              {metrics?.newUsers ? (
                <p className="text-xs text-green-600 mt-1">
                  +{metrics.newUsers} new
                </p>
              ) : null}
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active eSIMs</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics?.activeESIMs || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Key Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold text-gray-900">
                $
                {(
                  (metrics?.totalRevenue || 0) /
                  Math.max(metrics?.totalOrders || 1, 1) /
                  100
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <span className="text-gray-600">eSIM Utilization</span>
              <span className="font-semibold text-gray-900">
                {metrics?.totalUsers
                  ? ((metrics.activeESIMs / metrics.totalUsers) * 100).toFixed(
                      1,
                    )
                  : "0"}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue per User</span>
              <span className="font-semibold text-gray-900">
                $
                {(
                  (metrics?.totalRevenue || 0) /
                  Math.max(metrics?.totalUsers || 1, 1) /
                  100
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Summary
          </h2>
          <div className="space-y-4">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900">
                Revenue Status
              </p>
              <p className="text-xs text-primary-700 mt-1">
                Consistent growth over selected period
              </p>
            </div>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900">Order Trends</p>
              <p className="text-xs text-primary-800 mt-1">
                {metrics?.totalOrders || 0} total orders processed
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900">User Growth</p>
              <p className="text-xs text-amber-700 mt-1">
                {metrics?.totalUsers || 0} total users registered
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

