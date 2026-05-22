import db from "@config/database";
import { getCountryName } from "@/lib/countryMap";
import {
  ESimProfile,
  PackageDetail,
  DataPackage,
  esimAccessService,
  getAllDataPackages,
} from "@modules/esim/esim.service";

interface OrderMetadata {
  packageCode?: string;
  quantity?: number;
  paymentMethod?: string;
  unitPrice?: number;
  externalOrderNo?: string;
  [key: string]: unknown;
}

interface PackageSummary {
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

interface PurchaseSummary {
  id: string;
  orderNo: string;
  userEmail: string;
  countryCode: string;
  countryName: string;
  location: string;
  packageName: string;
  packageCode: string;
  volume: number;
  duration: number;
  cost: number;
  price: number;
  profit: number;
  status: string;
  createdAt: Date;
  quantity: number;
  unitPrice: number;
}

interface DailyOverviewPoint {
  name: string;
  value: number;
  amount: number;
}
export class AnalyticsService {
  private rawPriceToUsd(rawPrice: number | null | undefined): number {
    if (!rawPrice || rawPrice <= 0) return 0;
    return Math.round((rawPrice / 10000) * 100) / 100;
  }

  private rawVolumeToMb(rawVolume: number | null | undefined): number {
    if (!rawVolume || rawVolume <= 0) return 0;
    return Math.round(rawVolume / 100);
  }

  private toOrderMetadata(metadata: unknown): OrderMetadata {
    return metadata && typeof metadata === "object"
      ? (metadata as OrderMetadata)
      : {};
  }

  private async getPackageLookup(): Promise<Map<string, DataPackage>> {
    try {
      const packages = await getAllDataPackages();
      const packageArray = Array.isArray(packages) ? packages : [];
      return new Map(packageArray.map((pkg) => [pkg.packageCode, pkg]));
    } catch (error) {
      return new Map();
    }
  }
async getDashboardMetrics() {
    const now = new Date();
    const currentWindowStart = new Date(now);
    currentWindowStart.setDate(currentWindowStart.getDate() - 30);

    const previousWindowStart = new Date(currentWindowStart);
    previousWindowStart.setDate(previousWindowStart.getDate() - 30);

    const [
      totalUsers,
      paidOrdersCount,
      uniquePurchaserGroups,
      orderRevenueResult,
      transactionRevenueResult,
      currentWindowPaidOrders,
      previousWindowPaidOrders,
    ] = await Promise.all([
      db.user.count(),
      db.order.count({
        where: { paymentStatus: "paid" },
      }),
      db.order.groupBy({
        by: ["userId"],
        where: { paymentStatus: "paid" },
        _count: { userId: true },
      }),
      db.order.aggregate({
        where: { paymentStatus: "paid" },
        _sum: { totalAmount: true },
      }),
      db.transaction.aggregate({
        where: {
          transactionType: "ESIM_PURCHASE",
          status: "completed",
        },
        _sum: { amount: true },
      }),
      db.order.count({
        where: {
          paymentStatus: "paid",
          createdAt: {
            gte: currentWindowStart,
            lte: now,
          },
        },
      }),
      db.order.count({
        where: {
          paymentStatus: "paid",
          createdAt: {
            gte: previousWindowStart,
            lt: currentWindowStart,
          },
        },
      }),
    ]);

    const profilesData = await esimAccessService.queryESIMProfiles(1, 100);
    const profilesArray = profilesData?.esimList || [];
    const activeESIMs = profilesArray.filter(
      (profile) => profile.esimStatus === "IN_USE",
    ).length;

    const transactionRevenue = transactionRevenueResult._sum.amount || 0;
    const orderRevenue = orderRevenueResult._sum.totalAmount || 0;
    const totalRevenue = transactionRevenue > 0 ? transactionRevenue : orderRevenue;
    const uniquePurchasers = uniquePurchaserGroups.length;

    const growth =
      previousWindowPaidOrders > 0
        ? ((currentWindowPaidOrders - previousWindowPaidOrders) /
            previousWindowPaidOrders) *
          100
        : currentWindowPaidOrders > 0
          ? 100
          : 0;

    const roundedGrowth = Math.round(growth * 100) / 100;

    return {
      totalUsers,
      totalOrders: paidOrdersCount,
      totalCustomers: uniquePurchasers,
      totalESIMs: profilesArray.length,
      activeESIMs: Math.min(activeESIMs, paidOrdersCount),
      activeEsims: Math.min(activeESIMs, paidOrdersCount),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      growth: roundedGrowth,
      conversionRate:
        totalUsers > 0
          ? ((uniquePurchasers / totalUsers) * 100).toFixed(2)
          : "0",
    };
  }
async getRevenueAnalytics(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const payments = await db.payment.findMany({
      where: {
        status: "succeeded",
        createdAt: { gte: cutoffDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyRevenue: Record<string, number> = {};
    payments.forEach((payment) => {
      const dateKey = new Date(payment.createdAt).toISOString().split("T")[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + payment.amount;
    });

    return Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));
  }
async getUserGrowth(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const usersByDate = await db.user.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: { gte: cutoffDate },
      },
    });

    const dailyUsers: Record<string, number> = {};
    usersByDate.forEach((user: { createdAt: Date }) => {
      const dateKey = new Date(user.createdAt).toISOString().split("T")[0];
      dailyUsers[dateKey] = (dailyUsers[dateKey] || 0) + 1;
    });

    return Object.entries(dailyUsers)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, newUsers: count }));
  }
async getESIMStatusDistribution() {
    const profilesData = await esimAccessService.queryESIMProfiles(1, 100);
    const profiles = profilesData?.esimList || [];

    const statusCounts: Record<string, number> = {};

    profiles.forEach((profile: ESimProfile) => {
      const status = profile.esimStatus || "UNKNOWN";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }
async getTopSellingLocations(limit: number = 10) {
    const profilesData = await esimAccessService.queryESIMProfiles(1, 100);
    const profiles = profilesData?.esimList || [];

    const locationCounts: Record<string, { count: number; flag: string }> = {};

    profiles.forEach((profile: ESimProfile) => {
      if (profile.packageList && Array.isArray(profile.packageList)) {
        profile.packageList.forEach((pkg: PackageDetail) => {
          const location = pkg.locationCode || "UNKNOWN";
          const countryCode = location.substring(0, 2).toUpperCase();

          if (!locationCounts[location]) {
            locationCounts[location] = { count: 0, flag: countryCode };
          }
          locationCounts[location].count += 1;
        });
      }
    });

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([location, data]) => ({
        location,
        count: data.count,
        countryCode: data.flag,
      }));
  }
async getPurchaseOverview(days = 30): Promise<DailyOverviewPoint[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const orders = await db.order.findMany({
      where: {
        paymentStatus: "paid",
        createdAt: { gte: cutoffDate },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const grouped = new Map<string, { value: number; amount: number }>();

    orders.forEach((order) => {
      const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
      const current = grouped.get(dateKey) || { value: 0, amount: 0 };
      current.value += 1;
      current.amount += Number(order.totalAmount || 0);
      grouped.set(dateKey, current);
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({
      name: date,
      value: value.value,
      amount: Math.round(value.amount * 100) / 100,
    }));
  }
async getTopPackages(limit: number = 10): Promise<PackageSummary[]> {
    const [orders, packageLookup] = await Promise.all([
      db.order.findMany({
        where: {
          paymentStatus: "paid",
        },
        orderBy: { createdAt: "desc" },
        take: 500,
        select: {
          id: true,
          orderNo: true,
          userId: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          currency: true,
          metadata: true,
          transactionId: true,
          createdAt: true,
        },
      }),
      this.getPackageLookup(),
    ]);

    const orderGroups = new Map<
      string,
      {
        purchaseCount: number;
        totalRevenue: number;
        totalQuantity: number;
      }
    >();

    for (const order of orders) {
      const metadata = this.toOrderMetadata(order.metadata);
      const packageCode = String(metadata.packageCode || "").trim();
      if (!packageCode) continue;

      const quantity = Math.max(1, Number(metadata.quantity || 1));
      const totalAmount = Number(order.totalAmount || 0);

      const current = orderGroups.get(packageCode) || {
        purchaseCount: 0,
        totalRevenue: 0,
        totalQuantity: 0,
      };

      current.purchaseCount += 1;
      current.totalRevenue += totalAmount;
      current.totalQuantity += quantity;
      orderGroups.set(packageCode, current);
    }

    const settingsData = await db.settings.findFirst();
    const profitMargin = settingsData?.profitMargin || 1.5;

    return Array.from(orderGroups.entries())
      .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
      .map(([packageCode, stats]) => {
        const pkg = packageLookup.get(packageCode);
        const wholesalePrice = pkg ? this.rawPriceToUsd(pkg.price) : 0;
        const orderMetadataFallback = orders.find((order) => {
          const metadata = this.toOrderMetadata(order.metadata);
          return String(metadata.packageCode || "").trim() === packageCode;
        });
        const fallbackMetadata = this.toOrderMetadata(orderMetadataFallback?.metadata);
        const sellingPrice = pkg
          ? Math.round(wholesalePrice * profitMargin * 100) / 100
          : stats.purchaseCount > 0
            ? Math.round((stats.totalRevenue / stats.totalQuantity) * 100) / 100
            : 0;
        const countryCode =
          pkg?.location ||
          String(fallbackMetadata.countryCode || fallbackMetadata.locationCode || fallbackMetadata.location || "").trim() ||
          "GLOBAL";

        return {
          code: packageCode,
          name: pkg?.name || packageCode,
          location: countryCode,
          countryCode,
          countryName: getCountryName(countryCode),
          volume: pkg ? this.rawVolumeToMb(pkg.volume) : 0,
          duration: pkg?.duration || 0,
          sellingPrice,
          price: wholesalePrice,
          purchaseCount: stats.purchaseCount,
          totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
          locationsCount: pkg?.location ? 1 : 0,
        };
      });
  }
async getRecentPurchases(limit: number = 5): Promise<PurchaseSummary[]> {
    try {
      const [ordersResult, packageLookupResult, usersResult] = await Promise.allSettled([
        db.order.findMany({
          where: {
            paymentStatus: "paid",
          },
          orderBy: { createdAt: "desc" },
          take: Math.max(limit * 3, 10),
          select: {
            id: true,
            orderNo: true,
            userId: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            currency: true,
            metadata: true,
            transactionId: true,
            createdAt: true,
          },
        }),
        this.getPackageLookup(),
        db.user.findMany({
          select: {
            id: true,
            email: true,
          },
        }),
      ]);

      const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
      const packageLookup = packageLookupResult.status === "fulfilled"
        ? packageLookupResult.value
        : new Map<string, DataPackage>();
      const users = usersResult.status === "fulfilled" ? usersResult.value : [];

      const userLookup = new Map(users.map((user) => [user.id, user.email]));

      const purchases = orders
        .map((order) => {
          try {
            const metadata = this.toOrderMetadata(order.metadata);
            const packageCode = String(metadata.packageCode || "").trim();
            if (!packageCode) return null;

            const pkg = packageLookup.get(packageCode);
            const quantity = Math.max(1, Number(metadata.quantity || 1));
            const totalPrice = Number(order.totalAmount || 0);
            const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;
            const wholesalePrice = pkg ? this.rawPriceToUsd(pkg.price) : 0;
            const totalCost = Math.round(wholesalePrice * quantity * 100) / 100;
            const profit = Math.round((totalPrice - totalCost) * 100) / 100;
            const countryCode =
              pkg?.location ||
              String(metadata.countryCode || metadata.locationCode || metadata.location || "").trim() ||
              "GLOBAL";

            return {
              id: order.id,
              orderNo: order.orderNo,
              userEmail: userLookup.get(order.userId) || "Unknown",
              countryCode,
              countryName: getCountryName(countryCode),
              location: countryCode,
              packageName: pkg?.name || packageCode,
              packageCode,
              volume: pkg ? this.rawVolumeToMb(pkg.volume) : 0,
              duration: pkg?.duration || 0,
              cost: totalCost,
              price: Math.round(totalPrice * 100) / 100,
              profit,
              status: order.status,
              createdAt: order.createdAt,
              quantity,
              unitPrice: Math.round(unitPrice * 100) / 100,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as PurchaseSummary[];

      return purchases.slice(0, limit);
    } catch (error) {
      return [];
    }
  }
async getExpiringESIMs(daysThreshold: number = 7) {
    const profilesData = await esimAccessService.queryESIMProfiles(1, 100);
    const profiles = profilesData?.esimList || [];

    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    const expiringProfiles = profiles
      .filter((profile) => {
        const expireDate = new Date(profile.expiredTime);
        return expireDate <= thresholdDate && expireDate >= now;
      })
      .sort((a, b) => new Date(a.expiredTime).getTime() - new Date(b.expiredTime).getTime())
      .slice(0, 20);

    return expiringProfiles.map((profile) => ({
      iccid: profile.iccid,
      orderNo: profile.orderNo,
      status: profile.esimStatus,
      expiryDate: profile.expiredTime,
      daysRemaining: Math.ceil(
        (new Date(profile.expiredTime).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      ),
    }));
  }
async getDailyAnalyticsSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await db.order.count({
      where: {
        paymentStatus: "paid",
        createdAt: { gte: today },
      },
    });

    const todayUsers = await db.user.count({
      where: { createdAt: { gte: today } },
    });

    const revenueResult = await db.payment.aggregate({
      where: { status: "succeeded", createdAt: { gte: today } },
      _sum: { amount: true },
    });
    const todayRevenue = Math.round((revenueResult._sum.amount || 0) * 100) / 100;

    return {
      date: today.toISOString().split("T")[0],
      ordersCount: todayOrders,
      newUsers: todayUsers,
      revenue: todayRevenue,
    };
  }
async getPaymentStats() {
    const [total, succeeded, pending, failed] = await Promise.all([
      db.payment.count(),
      db.payment.count({ where: { status: "succeeded" } }),
      db.payment.count({ where: { status: "pending" } }),
      db.payment.count({ where: { status: "failed" } }),
    ]);

    const revenueResult = await db.payment.aggregate({
      where: { status: "succeeded" },
      _sum: { amount: true },
      _avg: { amount: true },
    });

    return {
      total,
      succeeded,
      pending,
      failed,
      totalRevenue: Math.round((revenueResult._sum.amount || 0) * 100) / 100,
      averageAmount: Math.round((revenueResult._avg.amount || 0) * 100) / 100,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;