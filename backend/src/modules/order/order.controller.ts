import { esimService } from "@modules/esim/esim.service";
import { asyncHandler } from "@utils/errors";
import logger from "@utils/logger";
import { sendError, sendSuccess } from "@utils/response";
import { Request, Response } from "express";
import statusCode from "http-status-codes";


interface OrderData extends Record<string, unknown> {
  id?: string;
  esimTranNo?: string;
  orderNo?: string;
  iccid?: string;
  status?: string;
  profileStatus?: string;
}

interface ESIMRenewal extends Record<string, unknown> {
  id?: string;
  orderNo?: string;
  iccid?: string;
  currentPrice?: number;
}
export const createOrder = asyncHandler(
  async (req: Request, res: Response) => {
    return sendError(
      res,
      "Order creation is handled through eSIMaccess API directly. Use /api/esims/esimaccess/orders",
      undefined,
      statusCode.BAD_REQUEST,
    );
  },
);

export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const order = await esimService.getOrderByOrderNo(id);

      if (!order) {
        return sendError(
          res,
          "Order not found",
          undefined,
          statusCode.NOT_FOUND,
        );
      }

      return sendSuccess(res, "Order retrieved", order);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch order";
      return sendError(
        res,
        "Failed to fetch order",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);

export const getUserOrders = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return sendError(
        res,
        "Unauthorized",
        "User not authenticated",
        statusCode.UNAUTHORIZED,
      );
    }

    const userId = req.user.userId;
    const pageNum = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.limit as string) || 10, 100);

    try {
      logger.info('[getUserOrders] Fetching user eSIMs', { userId, pageNum, pageSize });
      
      const result = await esimService.getUserMyESIMs(userId, pageNum, pageSize);

      logger.info('[getUserOrders] Successfully fetched user eSIMs', {
        userId,
        totalOrders: result.orders.length,
        pagination: result.pagination,
      });

      return sendSuccess(res, "User orders retrieved", {
        orders: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch orders";
      logger.error('[getUserOrders] Error fetching user orders', {
        userId,
        error: errorMsg,
        fullError: error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return sendError(
        res,
        "Failed to fetch orders",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);

export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return sendError(
        res,
        "Admin only",
        undefined,
        statusCode.FORBIDDEN,
      );
    }

    const pageNum = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.limit as string) || 10, 100);

    try {
      const result = await esimService.getOrdersWithPricing(pageNum, pageSize);

      return sendSuccess(res, "Orders retrieved", {
        orders: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch orders";
      return sendError(
        res,
        "Failed to fetch orders",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    return sendError(
      res,
      "Order status updates are handled by eSIMaccess webhooks",
      undefined,
      statusCode.BAD_REQUEST,
    );
  },
);

export const cancelOrder = asyncHandler(
  async (req: Request, res: Response) => {
    return sendError(
      res,
      "Order cancellation must be done through eSIMaccess dashboard",
      undefined,
      statusCode.BAD_REQUEST,
    );
  },
);
export const getActiveESIMs = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return sendError(
        res,
        "Unauthorized",
        "User not authenticated",
        statusCode.UNAUTHORIZED,
      );
    }

    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit as string) || 5;

      const result = await esimService.getUserMyESIMs(userId, 1, 50);
      const orders = (result.orders as OrderData[]) || [];

      if (orders.length === 0) {
        return sendSuccess(res, "Active eSIMs retrieved", []);
      }

      const mapActiveESIMs = (items: OrderData[]) => items
        .filter((order: OrderData) => {
          const status = order.status?.toLowerCase() || '';
          const esimStatus = (order.esimStatus as string)?.toUpperCase() || '';
          const profileStatus = (order.profileStatus as string)?.toUpperCase() || '';

          const rawExpiryDate = (order.expiresAt || order.profileExpiresAt || order.expiredTime) as string | undefined;
          const expiryDate = rawExpiryDate ? new Date(rawExpiryDate) : null;
          const isExpiredByDate = expiryDate ? expiryDate.getTime() <= Date.now() : false;

          const terminalStatuses = new Set([
            'USED_UP',
            'USED_EXPIRED',
            'CANCEL',
            'REVOKE',
            'SUSPEND',
          ]);

          const isTerminal = terminalStatuses.has(esimStatus);
          if (status === 'expired' || isTerminal || isExpiredByDate) {
            return false;
          }

          return (
            status === 'active' ||
            esimStatus === 'IN_USE' ||
            profileStatus === 'ENABLED'
          );
        })
        .slice(0, limit)
        .map((order: OrderData) => ({
          id: order.esimTranNo || order.id,
          orderNo: order.orderNo,
          iccid: order.iccid,
          status: order.status,
          totalVolume: order.totalVolume,
          totalDuration: order.totalDuration,
          durationUnit: order.durationUnit,
          expiredTime: order.expiredTime,
          activatedAt: order.activatedAt,
          expiresAt: order.expiresAt,
          profileExpiresAt: order.profileExpiresAt,
          daysUntilExpiry: order.daysUntilExpiry,
          dataUsage: order.dataUsage,
          dataUsagePercent: order.dataUsagePercent,
          remainingVolume: order.remainingVolume,
          createdAt: order.createdAt,
          packages: order.packageList || order.packages || [],
          costPrice: order.costPrice,
          totalPrice: order.totalPrice,
          profit: order.profit,
          plan: order.plan,
          esimStatus: order.esimStatus,
          profileStatus: order.profileStatus,
        }));

      let activeESIMs = mapActiveESIMs(orders);

      if (activeESIMs.length === 0 && orders.length > 0) {
        logger.warn("[getActiveESIMs] Empty active list on first pass, retrying once", {
          userId,
          ordersCount: orders.length,
        });

        const retryResult = await esimService.getUserMyESIMs(userId, 1, 50);
        const retryOrders = (retryResult.orders as OrderData[]) || [];
        activeESIMs = mapActiveESIMs(retryOrders);
      }

      return sendSuccess(res, "Active eSIMs retrieved", activeESIMs);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch active eSIMs";
      return sendError(
        res,
        "Failed to fetch active eSIMs",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
export const getExpiringESIMs = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return sendError(
        res,
        "Unauthorized",
        "User not authenticated",
        statusCode.UNAUTHORIZED,
      );
    }

    try {
      const userId = req.user.userId;
      const daysRange = parseInt(req.query.days as string) || 30;

      const result = await esimService.getUserMyESIMs(userId, 1, 50);
      const orders = (result.orders as OrderData[]) || [];

      if (orders.length === 0) {
        return sendSuccess(res, "Expiring eSIMs retrieved", []);
      }

      const now = new Date();
      const futureDate = new Date(now.getTime() + daysRange * 24 * 60 * 60 * 1000);

      const expiringESIMs = orders
        .filter((order: OrderData) => {
          const expiryDate = order.expiresAt || order.profileExpiresAt || order.expiredTime;
          if (!expiryDate) return false;
          
          const expiry = new Date(expiryDate as string | number);
          return expiry > now && expiry <= futureDate;
        })
        .map((order: OrderData) => {
          const expiryDate = new Date((order.expiresAt || order.profileExpiresAt || order.expiredTime) as string | number);
          const daysRemaining = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isUrgent = daysRemaining <= 7;

          return {
            id: order.esimTranNo || order.id,
            orderNo: order.orderNo,
            iccid: order.iccid,
            status: order.status,
            totalVolume: order.totalVolume,
            dataUsage: order.dataUsage,
            dataUsagePercent: order.dataUsagePercent,
            remainingVolume: order.remainingVolume,
            expiresAt: order.expiresAt,
            profileExpiresAt: order.profileExpiresAt,
            expiredTime: order.expiredTime,
            daysUntilExpiry: order.daysUntilExpiry,
            daysRemaining,
            isUrgent,
            activatedAt: order.activatedAt,
            totalDuration: order.totalDuration,
            durationUnit: order.durationUnit,
            packages: order.packageList || order.packages || [],
            plan: order.plan,
            totalPrice: order.totalPrice,
            costPrice: order.costPrice,
            profit: order.profit,
            esimStatus: order.esimStatus,
            profileStatus: order.profileStatus,
          };
        })
        .sort((a, b) => {
          const aRemaining = typeof a.daysRemaining === 'number' ? a.daysRemaining : 999;
          const bRemaining = typeof b.daysRemaining === 'number' ? b.daysRemaining : 999;
          return aRemaining - bRemaining;
        });

      return sendSuccess(res, "Expiring eSIMs retrieved", expiringESIMs);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch expiring eSIMs";
      return sendError(
        res,
        "Failed to fetch expiring eSIMs",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
export const bulkRenewESIMs = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return sendError(
        res,
        "Unauthorized",
        "User not authenticated",
        statusCode.UNAUTHORIZED,
      );
    }

    try {
      const { eSIMs } = req.body;

      if (!Array.isArray(eSIMs) || eSIMs.length === 0) {
        return sendError(
          res,
          "Invalid request",
          "eSIMs array is required and must not be empty",
          statusCode.BAD_REQUEST,
        );
      }

      if (eSIMs.length > 50) {
        return sendError(
          res,
          "Too many eSIMs",
          "Cannot renew more than 50 eSIMs at once",
          statusCode.BAD_REQUEST,
        );
      }

      const invalidESIMs = eSIMs.filter((e: ESIMRenewal) => !e.id || !e.orderNo || !e.iccid || typeof e.currentPrice !== 'number');
      if (invalidESIMs.length > 0) {
        return sendError(
          res,
          "Invalid eSIM data",
          "Each eSIM must have: id, orderNo, iccid, and currentPrice",
          statusCode.BAD_REQUEST,
        );
      }

      const totalRenewalCost = eSIMs.reduce((sum: number, e: ESIMRenewal) => sum + (e.currentPrice as number || 0), 0);

      const renewalSummary = {
        id: `renewal_${Date.now()}`,
        status: 'pending_payment',
        totalESIMs: eSIMs.length,
        totalCost: parseFloat(totalRenewalCost.toFixed(2)),
        eSIMsToRenew: eSIMs.map((e: ESIMRenewal) => ({
          id: e.id,
          orderNo: e.orderNo,
          iccid: e.iccid,
          renewalPrice: e.currentPrice,
          status: 'pending',
          estimatedRenewalDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

      return sendSuccess(
        res,
        "Bulk renewal initiated. Proceed to payment.",
        renewalSummary,
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to process bulk renewal";
      console.error("[Orders] Bulk renewal error:", error);
      return sendError(
        res,
        "Failed to process bulk renewal",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
export const getUserDashboardAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return sendError(
        res,
        "Unauthorized",
        "User not authenticated",
        statusCode.UNAUTHORIZED,
      );
    }

    try {
      const userId = req.user.userId;

      const result = await esimService.getUserMyESIMs(userId, 1, 100);
      const orders = (result.orders as OrderData[]) || [];

      if (orders.length === 0) {
        return sendSuccess(res, "Dashboard analytics retrieved", {
          chartData: [],
          stats: {
            totalSpent: 0,
            totalOrders: 0,
            activeESIMs: 0,
            avgOrderValue: 0,
            totalProfit: 0,
            totalSavings: 0,
          },
        });
      }

      const spendingByMonth: { [key: string]: number } = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      orders.forEach((order: OrderData) => {
        if (order.createdAt) {
          const date = new Date(order.createdAt as string | number);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
          spendingByMonth[monthKey] = (spendingByMonth[monthKey] || 0) + (order.totalPrice as number || 0);
        }
      });

      const chartData = Object.entries(spendingByMonth)
        .slice(-6)
        .map(([month, amount]) => ({
          month,
          amount: parseFloat(amount.toFixed(2)),
        }));

      const totalSpent: number = orders.reduce((sum: number, o: OrderData) => sum + ((o.totalPrice as number) || 0), 0);
      const totalProfit: number = orders.reduce((sum: number, o: OrderData) => sum + ((o.profit as number) || 0), 0);
      const totalSavings: number = orders.reduce((sum: number, o: OrderData) => sum + (((o.totalPrice as number) || 0) - ((o.costPrice as number) || 0)), 0);
      const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
      const activeCount = orders.filter((o: OrderData) => (o.status as string)?.toLowerCase() === 'active' || (o.profileStatus as string)?.toLowerCase().includes('active')).length;

      return sendSuccess(res, "Dashboard analytics retrieved", {
        chartData,
        stats: {
          totalSpent: parseFloat(totalSpent.toFixed(2)),
          totalOrders: orders.length,
          activeESIMs: activeCount,
          avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          totalSavings: parseFloat(totalSavings.toFixed(2)),
        },
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch dashboard analytics";
      return sendError(
        res,
        "Failed to fetch dashboard analytics",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
export const refreshActiveESIMsData = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return sendError(
        res,
        "Unauthorized",
        "User not authenticated",
        statusCode.UNAUTHORIZED,
      );
    }

    try {
      const userId = req.user.userId;

      logger.info(`[Orders Refresh] Fetching fresh active eSIM data for user ${userId}`);
      const result = await esimService.getUserMyESIMs(userId, 1, 100);
      const allOrders = (result.orders as OrderData[]) || [];

      const activeOrders = allOrders.filter(
        (order: OrderData) =>
          (order.status as string)?.toLowerCase() === "active" ||
          (order.esimStatus as string) === "IN_USE" ||
          (order.profileStatus as string) === "ENABLED",
      );

      logger.info(`[Orders Refresh] Found ${activeOrders.length} active eSIMs for user ${userId}`);

      if (activeOrders.length > 0) {
        logger.info(
          `[Orders Refresh] First active eSIM - OrderNo: ${activeOrders[0].orderNo}, DataUsage: ${activeOrders[0].dataUsage}, ProfileStatus: ${activeOrders[0].profileStatus}`,
        );
      }

      return sendSuccess(res, "Active eSIM data refreshed successfully", activeOrders);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to refresh active eSIM data";
      logger.error(`[Orders Refresh] Error: ${errorMsg}`, error);
      return sendError(
        res,
        "Failed to refresh active eSIM data",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);

