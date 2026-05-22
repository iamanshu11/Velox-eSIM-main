"use client";

import ActivateESIMModal from "@/components/ActivateESIMModal";
import Button from "@/components/Button";
import DashboardActiveESIMs from "@/components/DashboardActiveESIMs";
import { COUNTRY_CODE_TO_NAME } from "@/lib/countryMap";
import {
  useGetActiveESIMsQuery,
  useGetExpiringESIMsQuery,
  useGetUserOrdersQuery,
} from "@/store/slices/ordersSlice";
import type { Order } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [activeModal, setActiveModal] = useState<Order | null>(null);
  const [stableActiveESIMs, setStableActiveESIMs] = useState<any[]>([]);
  const [stableExpiringESIMs, setStableExpiringESIMs] = useState<any[]>([]);
  const [stableOrders, setStableOrders] = useState<Order[]>([]);

  const { data: ordersData, isError } = useGetUserOrdersQuery({ page: 1, limit: 50 });
  const { data: activeESIMs = [], isLoading: activeLoading } = useGetActiveESIMsQuery(undefined);
  const { data: expiringESIMs = [] } = useGetExpiringESIMsQuery(undefined);

  const orders = ordersData?.orders ?? [];
  const displayOrders = stableOrders.length > 0 ? stableOrders : orders;
  const displayActiveESIMs = stableActiveESIMs.length > 0 ? stableActiveESIMs : activeESIMs;
  const displayExpiringESIMs = stableExpiringESIMs.length > 0 ? stableExpiringESIMs : expiringESIMs;

  useEffect(() => {
    if (Array.isArray(activeESIMs) && activeESIMs.length > 0) {
      setStableActiveESIMs(activeESIMs);
    }
  }, [activeESIMs]);

  useEffect(() => {
    if (Array.isArray(expiringESIMs) && expiringESIMs.length > 0) {
      setStableExpiringESIMs(expiringESIMs);
    }
  }, [expiringESIMs]);

  useEffect(() => {
    if (Array.isArray(orders) && orders.length > 0) {
      setStableOrders(orders);
    }
  }, [orders]);

  const readyESIMs = displayOrders
    .filter((order: any) => order.status === "Ready")
    .map((order: any) => ({
      ...order,
      _locationCode:
        order.packageList?.[0]?.locationCode ||
        order.packages?.[0]?.location ||
        null,
      _planLabel:
        order.packageList?.[0]?.packageName ||
        order.plan?.name ||
        "Velox eSIM",
    }))
    .slice(0, 5);

  const totalActiveESIMs = displayActiveESIMs.length;
  const totalReadyESIMs = readyESIMs.length;
  const totalExpiringESIMs = displayExpiringESIMs.length;

  return (
    <div className="space-y-8">
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Failed to load dashboard data. Please refresh.</span>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-4xl font-black text-gray-950 mb-2">Your eSIMs</h1>
        <p className="text-gray-600">Manage your connected plans and data usage</p>
      </motion.div>

      {/* Status Overview Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        <motion.div
          whileHover={{ translateY: -3 }}
          className="bg-linear-to-br from-green-50 to-green-50/30 border-2 border-green-200 rounded-xl p-7 hover:shadow-lg hover:shadow-green-200/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Plans</h3>
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-4xl font-black text-green-700 mb-1">{totalActiveESIMs}</p>
          <p className="text-xs text-green-600 font-medium">Currently in use</p>
        </motion.div>

        <motion.div
          whileHover={{ translateY: -3 }}
          className="bg-linear-to-br from-amber-50 to-amber-50/30 border-2 border-amber-200 rounded-xl p-7 hover:shadow-lg hover:shadow-amber-200/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ready to Activate</h3>
            <Zap className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-4xl font-black text-amber-700 mb-1">{totalReadyESIMs}</p>
          <p className="text-xs text-amber-600 font-medium">Awaiting activation</p>
        </motion.div>

        <motion.div
          whileHover={{ translateY: -3 }}
          className="bg-linear-to-br from-red-50 to-red-50/30 border-2 border-red-200 rounded-xl p-7 hover:shadow-lg hover:shadow-red-200/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Expiring Soon</h3>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-4xl font-black text-red-700 mb-1">{totalExpiringESIMs}</p>
          <p className="text-xs text-red-600 font-medium">Within 30 days</p>
        </motion.div>
      </motion.div>

      {/* Ready to Activate � compact on-theme banner */}
      {totalReadyESIMs > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-primary-200 bg-primary-50 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary-700" />
            <span className="text-sm font-semibold text-primary-800">
              {totalReadyESIMs} eSIM{totalReadyESIMs !== 1 ? "s" : ""} ready to activate
            </span>
          </div>

          <div className="space-y-2">
            {readyESIMs.map((esim: any, idx: number) => {
              const countryName = esim._locationCode
                ? COUNTRY_CODE_TO_NAME[esim._locationCode.toUpperCase()] ?? esim._locationCode
                : "Global";

              return (
                <motion.div
                  key={esim.id ?? esim.orderNo ?? idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="bg-white border border-primary-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-all"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{esim._planLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{countryName}</p>
                  </div>
                  <button
                    onClick={() => setActiveModal(esim as Order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    Activate
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Active eSIMs Section */}
      {(activeLoading || displayActiveESIMs.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-950 flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
              Active Plans
            </h2>
            <Link href="/dashboard/esims" className="text-primary-600 hover:text-primary-700 hover:underline font-semibold text-sm transition-colors">
              View All →
            </Link>
          </div>
          <DashboardActiveESIMs esims={displayActiveESIMs} isLoading={activeLoading} />
        </motion.div>
      )}

      {/* Empty State */}
      {totalActiveESIMs === 0 && totalReadyESIMs === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center"
        >
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-lg mb-2">No eSIMs Yet</p>
          <p className="text-gray-600 mb-6">
            Get started by purchasing your first eSIM plan and stay connected anywhere in the world
          </p>
          <Link href="/esims">
            <Button variant="primary" size="lg">
              Browse Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Activate eSIM Modal */}
      <ActivateESIMModal
        isOpen={activeModal !== null}
        order={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
