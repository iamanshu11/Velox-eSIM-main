"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { BackendApiResponse, BackendPaginatedResponse } from "@/types/api";
import logger from "@/lib/logger";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import Card from "@/components/Card";
import Container from "@/components/Container";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { formatDate } from "@/utils/formatters";
import { getStatusColor, getStatusIcon } from "@/utils/statusHelpers";

interface Order {
  id?: string;
  userId?: string;
  planId?: string;
  orderNo?: string;
  quantity: number;
  totalPrice: number;
  costPrice?: number;
  actualCost?: number;
  sellingPrice?: number;
  profit?: number;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  iccid?: string;
  msisdn?: string;
  imsi?: string;
  smdpPlus?: string;
  profileStatus?: string;
  esimTranNo?: string;
  qrCodeUrl?: string;
  shortUrl?: string;
  smdpStatus?: string;
  eid?: string;
  activeType?: number;
  dataType?: number;
  activateTime?: string;
  expiredTime?: string;
  installationTime?: string;
  totalVolume?: number;
  totalDuration?: number;
  durationUnit?: string;
  orderUsage?: number;
  pin?: string;
  puk?: string;
  apn?: string;
  ipExport?: string;
  packageList?: Array<{
    packageName: string;
    packageCode: string;
    slug: string;
    duration: number;
    volume: number;
    locationCode: string;
    createTime: string;
  }>;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<BackendPaginatedResponse<Order>>(`/orders?limit=10&page=${currentPage}`);
      const responseData = res?.data || res;

      if (typeof responseData === 'object' && !Array.isArray(responseData) && 'pagination' in responseData && responseData.pagination) {
        setOrders((responseData as any).orders || []);
        setTotal((responseData as any).pagination.total);
      } else if (Array.isArray(responseData)) {
        setOrders(responseData);
        setTotal(responseData.length);
      } else {
        setOrders([]);
        setTotal(0);
      }
    } catch (error) {
      logger.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const res = await apiClient.get<BackendApiResponse<{ balance: number }>>(`/esims/balance`);
      const balanceData = res?.data;
      if (balanceData?.balance !== undefined) {
        setBalance(balanceData.balance);
      }
    } catch (error) {
      logger.error("Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBalance();
  }, [currentPage]);

  const totalPages = Math.ceil(total / 10);



  if (loading && orders.length === 0) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="space-y-2">
            <div className="h-10 w-1/4 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
                <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-200" />
              </Card>
            ))}
          </div>
          <Card className="overflow-hidden">
            <div className="p-6">
              <CardSkeleton count={10} />
            </div>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <motion.div className="space-y-6 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-secondary-900">Orders</h1>
          <p className="text-secondary-600">Manage and track all customer orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border border-primary-200 bg-linear-to-br from-primary-50 to-neutral-100 p-6">
            <p className="mb-2 text-sm font-semibold text-secondary-600">Account Balance</p>
            {balanceLoading ? (
              <p className="text-3xl font-bold text-secondary-400">Loading...</p>
            ) : (
              <p className="text-3xl font-bold text-primary-800">
                ${balance !== null ? balance.toFixed(2) : "0.00"}
              </p>
            )}
          </Card>
          <Card className="p-6">
            <p className="mb-2 text-sm text-secondary-600">Total Orders</p>
            <p className="text-3xl font-bold text-secondary-900">{total}</p>
          </Card>
          <Card className="p-6">
            <p className="mb-2 text-sm text-secondary-600">Completed</p>
            <p className="text-3xl font-bold text-primary-700">
              {orders.filter((o) => o.status === "Completed").length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="mb-2 text-sm text-secondary-600">Total Revenue</p>
            <p className="text-3xl font-bold text-primary-700">
              ${orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2)}
            </p>
          </Card>
          <Card className="p-6">
            <p className="mb-2 text-sm text-secondary-600">Total Profit</p>
            <p className="text-3xl font-bold text-primary-700">
              ${orders.reduce((sum, o) => sum + (o.profit || 0), 0).toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-secondary-300" />
              <p className="text-secondary-600">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Order No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      No. of eSIMs
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Create Time
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-secondary-900">
                      Cost
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-secondary-900">
                      Selling Price
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-secondary-900">
                      Profit
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders.map((order, index) => {
                    const uniqueId = order.id || `order-${index}`;
                    const handleRowClick = () => {
                      router.push(`/admin/esims/${order.orderNo}`);
                    };

                    return (
                      <motion.tr
                        key={uniqueId}
                        className="cursor-pointer transition-colors hover:bg-neutral-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={handleRowClick}
                      >
                        <td className="px-6 py-4">
                          <code className="text-sm font-mono font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded">
                            {order.orderNo || order.id?.substring(0, 8) || "N/A"}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-secondary-900">
                            {order.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-secondary-700">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-secondary-900">
                            ${(order.costPrice || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-primary-700">
                            ${(order.totalPrice || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-semibold ${(order.profit || 0) > 0 ? 'text-primary-700' : 'text-secondary-600'}`}>
                            ${(order.profit || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary-600">
              Showing {(currentPage - 1) * 10 + 1} to{" "}
              {Math.min(currentPage * 10, total)} of {total} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded p-2 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded font-medium transition-colors ${currentPage === pageNum
                        ? "bg-primary-700 text-white"
                        : "text-secondary-700 hover:bg-neutral-200"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded p-2 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </Container>
  );
}

