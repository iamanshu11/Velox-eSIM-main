"use client";

import Button from "@/components/Button";
import Card from "@/components/Card";
import { EditUserModal } from "@/components/EditUserModal";
import Loader from "@/components/Loader";
import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";
import { BackendApiResponse } from "@/types/api";
import { formatDate } from "@/utils/formatters";
import { getCountryName } from "@/lib/countryMap";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Edit3,
  History,
  Globe,
  Mail,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Wallet,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  countryCode?: string | null;
  countryName?: string | null;
  countrySource?: string | null;
  lastSeenCountryCode?: string | null;
  lastSeenCountryName?: string | null;
  lastSeenAt?: string | null;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface WalletInfo {
  balance: number;
  currency: string;
  updatedAt: string | null;
}

interface SummaryInfo {
  totalOrders: number;
  totalESIMOrders: number;
  activeESIMs: number;
  completedOrders: number;
  pendingOrders: number;
  totalTransactions: number;
  totalPayments: number;
  totalDevices: number;
  totalSupportTickets: number;
  unreadNotifications: number;
  activeAutoRenewals: number;
  totalReferralCodes: number;
  monthlySpending: number;
  monthlyCredits: number;
}

interface OrderHistoryItem {
  id: string;
  orderNo: string;
  transactionId?: string | null;
  totalAmount?: number | null;
  status: string;
  paymentStatus: string;
  currency: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface EsimHistoryItem {
  id: string;
  orderNo: string;
  status?: string;
  totalPrice?: number;
  costPrice?: number;
  profit?: number;
  paymentStatus?: string;
  createdAt: string;
  expiredTime?: string;
  totalVolume?: number;
  dataUsage?: number;
  remainingVolume?: number;
  plan?: {
    name?: string;
    countryCode?: string;
  };
}

interface TransactionHistoryItem {
  id: string;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  reference?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

interface PaymentHistoryItem {
  id: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DeviceItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  deviceType: string;
  isActive: boolean;
  carrier?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface SupportTicketItem {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AutoRenewalItem {
  id: string;
  esimId: string;
  enabled: boolean;
  renewalDaysBefore: number;
  autoPayFromWallet: boolean;
  renewalCount: number;
  maxAutoRenewals: number;
  nextScheduledRenewal?: string | null;
  createdAt: string;
}

interface ReferralCodeItem {
  id: string;
  code: string;
  discount: number;
  usedCount: number;
  maxUses: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

interface ActivityLogItem {
  id: string;
  action: string;
  resource?: string | null;
  module?: string | null;
  details?: string | null;
  createdAt: string;
}

interface AdminUserOverviewResponse {
  user: AdminUser;
  wallet: WalletInfo;
  summary: SummaryInfo;
  history: {
    orders: OrderHistoryItem[];
    esims: EsimHistoryItem[];
    transactions: TransactionHistoryItem[];
    payments: PaymentHistoryItem[];
    devices: DeviceItem[];
    notifications: NotificationItem[];
    supportTickets: SupportTicketItem[];
    autoRenewals: AutoRenewalItem[];
    referralCodes: ReferralCodeItem[];
    activityLogs: ActivityLogItem[];
  };
}

type TimelineEntry = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: "blue" | "green" | "amber" | "red" | "purple" | "slate";
};

const statToneStyles = {
  blue: "border-primary-200 bg-primary-50 text-primary-800",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatRelativeTime(iso: string) {
  if (!iso) return "N/A";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} days ago`;
}

function getBadgeTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("active") || normalized.includes("completed") || normalized.includes("success") || normalized.includes("paid")) {
    return "bg-green-100 text-green-700";
  }
  if (normalized.includes("pending") || normalized.includes("processing") || normalized.includes("open") || normalized.includes("read")) {
    return "bg-amber-100 text-amber-700";
  }
  if (normalized.includes("failed") || normalized.includes("cancel") || normalized.includes("inactive") || normalized.includes("disabled")) {
    return "bg-red-100 text-red-700";
  }
  if (normalized.includes("verified") || normalized.includes("enabled")) {
    return "bg-primary-100 text-primary-800";
  }
  return "bg-slate-100 text-slate-700";
}

function SectionShell({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="p-6 lg:p-8 scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
      {message}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [overview, setOverview] = useState<AdminUserOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [adjustmentDirection, setAdjustmentDirection] = useState<"increase" | "decrease">("increase");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentMessage, setAdjustmentMessage] = useState<string | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [useHtmlMode, setUseHtmlMode] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const loadOverview = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<BackendApiResponse<AdminUserOverviewResponse>>(
        `/admin/users/${userId}/overview`,
        { timeoutMs: 60000 },
      );

      if (response?.data) {
        setOverview(response.data);
      } else {
        setError("User not found");
      }
    } catch (err) {
      const errorDetails =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null
            ? (() => {
                const candidate = err as any;
                const responseData = candidate?.response?.data;
                const responseMessage =
                  responseData?.message || responseData?.error?.message || "";
                const message =
                  typeof candidate?.message === "string"
                    ? candidate.message
                    : "";
                return [responseMessage, message].filter(Boolean).join(" - ");
              })()
            : String(err || "");

      const message = errorDetails || "Failed to load user overview";
      setError(message);
      logger.error("Failed to load admin user overview", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, [userId]);

  const handleDelete = async () => {
    if (!overview?.user) return;

    const confirmed = window.confirm(
      `Deactivate ${overview.user.email}?`,
    );
    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      await apiClient.delete(`/admin/users/${overview.user.id}`);
      router.push("/admin/users");
    } catch (err) {
      logger.error("Failed to delete admin user", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSuccess = async () => {
    setIsEditOpen(false);
    await loadOverview();
  };

  const handleWalletAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(adjustmentAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAdjustmentError("Enter a valid amount greater than zero.");
      setAdjustmentMessage(null);
      return;
    }

    try {
      setAdjustmentLoading(true);
      setAdjustmentError(null);
      setAdjustmentMessage(null);

      const response = await apiClient.post<BackendApiResponse<{ wallet: WalletInfo }>>(
        `/admin/users/${userId}/wallet-adjustment`,
        {
          amount: parsedAmount,
          direction: adjustmentDirection,
          reason: adjustmentReason || undefined,
        },
      );

      const updatedWallet = response?.data?.wallet;

      if (updatedWallet) {
        setOverview((currentOverview) =>
          currentOverview
            ? {
                ...currentOverview,
                wallet: updatedWallet,
              }
            : currentOverview,
        );
      }

      setAdjustmentMessage(
        response?.message || `Wallet ${adjustmentDirection === "increase" ? "increased" : "reduced"} successfully.`,
      );
      setAdjustmentAmount("");
      setAdjustmentReason("");
      await loadOverview();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update wallet";
      setAdjustmentError(message);
      logger.error("Failed to adjust admin user wallet", message);
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const handleSendCustomEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailSubject.trim()) {
      setEmailError("Subject is required.");
      setEmailSuccess(null);
      return;
    }

    if (!useHtmlMode && !emailMessage.trim()) {
      setEmailError("Message is required.");
      setEmailSuccess(null);
      return;
    }

    if (useHtmlMode && !emailHtml.trim()) {
      setEmailError("HTML body is required in HTML mode.");
      setEmailSuccess(null);
      return;
    }

    try {
      setEmailLoading(true);
      setEmailError(null);
      setEmailSuccess(null);

      const response = await apiClient.post<BackendApiResponse<{ email: { subject: string; sentAt: string } }>>(
        `/admin/users/${userId}/send-email`,
        {
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
          ...(useHtmlMode ? { html: emailHtml.trim() } : {}),
        },
      );

      setEmailSuccess(response?.message || "Email sent successfully.");
      setEmailMessage("");
      setEmailHtml("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send email";
      setEmailError(message);
      logger.error("Failed to send admin custom email", message);
    } finally {
      setEmailLoading(false);
    }
  };

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    if (!overview) return [];

    const entries: TimelineEntry[] = [];

    overview.history.orders.slice(0, 5).forEach((order) => {
      entries.push({
        id: `order-${order.id}`,
        title: `Order ${order.orderNo}`,
        description: `${order.status} · ${order.paymentStatus} · ${formatMoney(order.totalAmount || 0, order.currency)}`,
        timestamp: order.createdAt,
        tone: order.status.toLowerCase().includes("complete") ? "green" : order.status.toLowerCase().includes("pending") ? "amber" : "slate",
      });
    });

    overview.history.transactions.slice(0, 5).forEach((transaction) => {
      entries.push({
        id: `transaction-${transaction.id}`,
        title: `Transaction ${transaction.transactionType}`,
        description: `${formatMoney(transaction.amount)} · ${transaction.status}`,
        timestamp: transaction.createdAt,
        tone: transaction.transactionType === "REFUND" ? "purple" : transaction.transactionType === "ESIM_PURCHASE" ? "blue" : "green",
      });
    });

    overview.history.payments.slice(0, 4).forEach((payment) => {
      entries.push({
        id: `payment-${payment.id}`,
        title: `Payment ${payment.status}`,
        description: `${formatMoney(payment.amount, payment.currency)} · ${payment.stripePaymentIntentId}`,
        timestamp: payment.createdAt,
        tone: payment.status.toLowerCase().includes("succeed") ? "green" : payment.status.toLowerCase().includes("pend") ? "amber" : "red",
      });
    });

    overview.history.supportTickets.slice(0, 3).forEach((ticket) => {
      entries.push({
        id: `ticket-${ticket.id}`,
        title: `Support ticket: ${ticket.subject}`,
        description: `${ticket.status} · ${ticket.priority}`,
        timestamp: ticket.createdAt,
        tone: ticket.status.toLowerCase().includes("resolv") ? "green" : ticket.status.toLowerCase().includes("open") ? "amber" : "slate",
      });
    });

    overview.history.notifications.slice(0, 3).forEach((notification) => {
      entries.push({
        id: `notification-${notification.id}`,
        title: `Notification: ${notification.title}`,
        description: notification.message,
        timestamp: notification.createdAt,
        tone: notification.isRead ? "slate" : "blue",
      });
    });

    overview.history.activityLogs.slice(0, 4).forEach((entry) => {
      entries.push({
        id: `activity-${entry.id}`,
        title: `Activity: ${entry.action}`,
        description: [entry.module, entry.resource, entry.details].filter(Boolean).join(" · ") || "Admin activity",
        timestamp: entry.createdAt,
        tone: "slate",
      });
    });

    return entries
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 12);
  }, [overview]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="mt-1 text-gray-600">View the full admin-visible history for a single user</p>
          </div>
          <Link href="/admin/users">
            <Button variant="secondary" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Button>
          </Link>
        </div>

        <Card className="border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Unable to load user overview</p>
              <p className="text-sm text-red-700">{error || "The requested user could not be found."}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { user, wallet, summary, history } = overview;
  const profileCountryName = user.countryName || getCountryName(user.countryCode || undefined);
  const lastSeenCountryName = user.lastSeenCountryName || getCountryName(user.lastSeenCountryCode || undefined);
  const hasProfileCountry = Boolean(user.countryCode || user.countryName);
  const hasLastSeenCountry = Boolean(user.lastSeenCountryCode || user.lastSeenCountryName || user.lastSeenAt);
  const accountAgeDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  const topStats = [
    { label: "Total Orders", value: summary.totalOrders, tone: "blue" as const },
    { label: "eSIM Orders", value: summary.totalESIMOrders, tone: "green" as const },
    { label: "Active eSIMs", value: summary.activeESIMs, tone: "purple" as const },
    { label: "Transactions", value: summary.totalTransactions, tone: "slate" as const },
    { label: "Payments", value: summary.totalPayments, tone: "amber" as const },
    { label: "Devices", value: summary.totalDevices, tone: "blue" as const },
    { label: "Support Tickets", value: summary.totalSupportTickets, tone: "red" as const },
    { label: "Unread Notifications", value: summary.unreadNotifications, tone: "green" as const },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-950">User Details</h1>
          <p className="mt-2 text-gray-600">Complete admin-visible overview for one account</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/users">
            <Button variant="secondary" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Button>
          </Link>
          <Button
            variant="primary"
            className="inline-flex items-center gap-2"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit3 className="h-4 w-4" />
            Edit User
          </Button>
          <Button
            variant="danger"
            className="inline-flex items-center gap-2"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            <Trash2 className="h-4 w-4" />
            {deleteLoading ? "Deactivating..." : "Deactivate"}
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary-900 to-primary-600 text-white shadow-lg">
                <User className="h-8 w-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.name || user.email.split("@")[0]}
                  </h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.emailVerified ? "bg-primary-100 text-primary-800" : "bg-amber-100 text-amber-700"}`}>
                    {user.emailVerified ? "Verified" : "Pending verification"}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <ShieldCheck className="h-4 w-4" />
                  {user.role}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Globe className="h-4 w-4" />
                      Country
                    </div>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {hasProfileCountry ? profileCountryName || "Unknown" : "Location not captured yet"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hasProfileCountry
                        ? `${user.countryCode || "N/A"}${user.countrySource ? ` · ${user.countrySource}` : ""}`
                        : "This account has not recorded a country from a login or registration event yet."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Globe className="h-4 w-4" />
                      Last seen
                    </div>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {hasLastSeenCountry ? lastSeenCountryName || "Unknown" : "No recent location"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hasLastSeenCountry
                        ? `${user.lastSeenCountryCode || "N/A"}${user.lastSeenAt ? ` · ${formatRelativeTime(user.lastSeenAt)}` : ""}`
                        : "A future login will populate this field."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Wallet Balance</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(wallet.balance, wallet.currency)}</p>
              <p className="mt-1 text-xs text-gray-500">
                Updated {wallet.updatedAt ? formatRelativeTime(wallet.updatedAt) : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Created</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Updated</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatDate(user.updatedAt)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account Age</p>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {accountAgeDays} day{accountAgeDays === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monthly Spending</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatMoney(summary.monthlySpending, wallet.currency)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monthly Credits</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatMoney(summary.monthlyCredits, wallet.currency)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Automation</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{summary.activeAutoRenewals} active renewals</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-50 p-3 text-primary-800">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Account Health</h3>
                <p className="text-sm text-gray-600">Admin-visible signals and ownership data</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">Active account</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  <BadgeCheck className="h-4 w-4" />
                  {user.isActive ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">Email verified</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${user.emailVerified ? "bg-primary-100 text-primary-800" : "bg-amber-100 text-amber-700"}`}>
                  <BadgeCheck className="h-4 w-4" />
                  {user.emailVerified ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">Support tickets</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  <MessageSquare className="h-4 w-4" />
                  {summary.totalSupportTickets}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">Devices</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  <Smartphone className="h-4 w-4" />
                  {summary.totalDevices}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quick History</h3>
                <p className="text-sm text-gray-600">Recent activity counts</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {topStats.map((stat) => (
                <div key={stat.label} className={`rounded-2xl border p-4 ${statToneStyles[stat.tone]}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send Custom Email</h3>
                <p className="text-sm text-gray-600">Send a direct message to this user</p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSendCustomEmail}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Recipient</label>
                <input
                  type="text"
                  value={user.email}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  placeholder="Enter email subject"
                  maxLength={180}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">HTML mode</span>
                <Button
                  type="button"
                  variant={useHtmlMode ? "primary" : "secondary"}
                  onClick={() => setUseHtmlMode((current) => !current)}
                  className="px-3 py-1 text-xs"
                >
                  {useHtmlMode ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {useHtmlMode ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">HTML Body</label>
                  <textarea
                    value={emailHtml}
                    onChange={(event) => setEmailHtml(event.target.value)}
                    placeholder="<h1>Hello</h1><p>Custom email body...</p>"
                    rows={6}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(event) => setEmailMessage(event.target.value)}
                    placeholder="Write your message"
                    rows={6}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              )}

              {emailSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {emailSuccess}
                </div>
              )}

              {emailError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {emailError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={emailLoading}
                className="w-full"
              >
                {emailLoading ? "Sending email..." : "Send Email"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            ["orders", "Orders"],
            ["esims", "eSIMs"],
            ["wallet", "Wallet"],
            ["payments", "Payments"],
            ["devices", "Devices"],
            ["support", "Support"],
            ["notifications", "Notifications"],
            ["automation", "Automation"],
            ["timeline", "Timeline"],
          ].map(([id, label]) => (
            <Link
              key={id}
              href={`#${id}`}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-white hover:text-gray-900"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <SectionShell id="orders" title="Order History" subtitle="Orders and purchase records tied to this user">
        {history.orders.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{order.orderNo}</p>
                      <p className="text-xs text-gray-500">{(order.metadata?.packageCode as string) || "Package unavailable"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatMoney(order.totalAmount || 0, order.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No order history is available for this user." />
        )}
      </SectionShell>

      <SectionShell id="esims" title="eSIM History" subtitle="Enriched purchase and profile history from the eSIM service">
        {history.esims.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Usage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.esims.map((esim) => (
                  <tr key={esim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{esim.plan?.name || "eSIM Purchase"}</p>
                      <p className="text-xs text-gray-500">{esim.plan?.countryCode || "GLOBAL"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{esim.orderNo}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(esim.status || "")}`}>
                        {esim.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {typeof esim.dataUsage === "number" && typeof esim.totalVolume === "number"
                        ? `${esim.dataUsage} / ${esim.totalVolume}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{esim.expiredTime ? formatDate(esim.expiredTime) : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No eSIM profile history was returned for this user." />
        )}
      </SectionShell>

      <SectionShell id="wallet" title="Wallet & Transactions" subtitle="Wallet balance changes and transaction ledger">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-slate-50 to-slate-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Balance</p>
            <p className="mt-2 text-4xl font-bold text-gray-900">{formatMoney(wallet.balance, wallet.currency)}</p>
            <p className="mt-2 text-sm text-gray-600">Updated {wallet.updatedAt ? formatRelativeTime(wallet.updatedAt) : "N/A"}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-gray-500">Credits</p>
                <p className="mt-1 font-semibold text-gray-900">{formatMoney(summary.monthlyCredits, wallet.currency)}</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-gray-500">Spend</p>
                <p className="mt-1 font-semibold text-gray-900">{formatMoney(summary.monthlySpending, wallet.currency)}</p>
              </div>
            </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary-50 p-3 text-primary-800">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Adjust Wallet</h3>
                  <p className="text-sm text-gray-600">Increase or reduce this user's balance</p>
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleWalletAdjustment}>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentDirection("increase")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${adjustmentDirection === "increase" ? "bg-primary-600 text-white shadow-sm" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    Increase
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentDirection("decrease")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${adjustmentDirection === "decrease" ? "bg-red-600 text-white shadow-sm" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    Reduce
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(event) => setAdjustmentAmount(event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(event) => setAdjustmentReason(event.target.value)}
                    placeholder="Optional reason for this adjustment"
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {adjustmentMessage && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {adjustmentMessage}
                  </div>
                )}

                {adjustmentError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {adjustmentError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant={adjustmentDirection === "increase" ? "primary" : "danger"}
                  disabled={adjustmentLoading}
                  className="w-full inline-flex items-center justify-center gap-2"
                >
                  {adjustmentLoading ? "Updating balance..." : adjustmentDirection === "increase" ? "Add Balance" : "Reduce Balance"}
                </Button>
              </form>
            </div>
          </div>

          {history.transactions.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Balance</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {history.transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{transaction.transactionType}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatMoney(transaction.amount, wallet.currency)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatMoney(transaction.balanceAfter, wallet.currency)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(transaction.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No wallet transactions were found for this user." />
          )}
        </div>
      </SectionShell>

      <SectionShell id="payments" title="Payments" subtitle="Stripe and top-up payment records">
        {history.payments.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Intent</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{payment.stripePaymentIntentId}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatMoney(payment.amount, payment.currency)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No payment records are available for this user." />
        )}
      </SectionShell>

      <SectionShell id="devices" title="Devices" subtitle="Registered devices linked to the account">
        {history.devices.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Device</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{device.name}</p>
                      <p className="text-xs text-gray-500">{device.brand} {device.model}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{device.deviceType}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${device.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {device.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(device.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No devices are linked to this user." />
        )}
      </SectionShell>

      <SectionShell id="support" title="Support Tickets" subtitle="Tickets, issues, and customer support history">
        {history.supportTickets.length > 0 ? (
          <div className="space-y-4">
            {history.supportTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-gray-600">{ticket.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(ticket.status)}`}>{ticket.status}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeTone(ticket.priority)}`}>{ticket.priority}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">{ticket.category || "Uncategorized"} · Updated {formatDate(ticket.updatedAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No support tickets were found for this user." />
        )}
      </SectionShell>

      <SectionShell id="notifications" title="Notifications" subtitle="Unread and read in-app messages">
        {history.notifications.length > 0 ? (
          <div className="space-y-4">
            {history.notifications.map((notification) => (
              <div key={notification.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${notification.isRead ? "bg-slate-100 text-slate-700" : "bg-primary-100 text-primary-800"}`}>
                    {notification.isRead ? "Read" : "Unread"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500">{notification.type} · {formatDate(notification.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No notifications were found for this user." />
        )}
      </SectionShell>

      <SectionShell id="automation" title="Automation & Referrals" subtitle="Auto-renewal setup and referral program details">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Auto-Renewals</h3>
            {history.autoRenewals.length > 0 ? (
              history.autoRenewals.map((renewal) => (
                <div key={renewal.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{renewal.esimId}</p>
                      <p className="mt-1 text-sm text-gray-600">Renew {renewal.renewalDaysBefore} day(s) before expiry</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${renewal.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {renewal.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <p>Wallet pay: {renewal.autoPayFromWallet ? "Yes" : "No"}</p>
                    <p>Renewals: {renewal.renewalCount}/{renewal.maxAutoRenewals}</p>
                    <p>Next run: {renewal.nextScheduledRenewal ? formatDate(renewal.nextScheduledRenewal) : "N/A"}</p>
                    <p>Created: {formatDate(renewal.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No auto-renewal rules are configured for this user." />
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Referral Codes</h3>
            {history.referralCodes.length > 0 ? (
              history.referralCodes.map((referral) => (
                <div key={referral.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-lg font-bold text-gray-900">{referral.code}</p>
                      <p className="mt-1 text-sm text-gray-600">{referral.discount}% discount</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${referral.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {referral.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <p>Used: {referral.usedCount}</p>
                    <p>Limit: {referral.maxUses || "Unlimited"}</p>
                    <p>Created: {formatDate(referral.createdAt)}</p>
                    <p>Expires: {referral.expiresAt ? formatDate(referral.expiresAt) : "N/A"}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No referral codes are linked to this user." />
            )}
          </div>
        </div>
      </SectionShell>

      <SectionShell id="timeline" title="Activity Timeline" subtitle="Combined timeline of user history that an admin can review at a glance">
        {timelineEntries.length > 0 ? (
          <div className="space-y-4">
            {timelineEntries.map((entry) => (
              <div key={entry.id} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className={`mt-1 h-3 w-3 rounded-full ${entry.tone === "green" ? "bg-green-500" : entry.tone === "amber" ? "bg-amber-500" : entry.tone === "red" ? "bg-red-500" : entry.tone === "purple" ? "bg-purple-500" : entry.tone === "blue" ? "bg-primary-500" : "bg-slate-500"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{entry.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{entry.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatRelativeTime(entry.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No activity history was available for this user." />
        )}
      </SectionShell>

      <EditUserModal
        isOpen={isEditOpen}
        user={user}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

