import { AppError } from "@utils/errors";
import logger from "@utils/logger";
import axios from "axios";
import { settingsService } from "@modules/settings/settings.service";
import db from "@config/database";
interface ESIMAccessOrder extends Record<string, unknown> {
  orderNo?: string;
  quantity?: number;
  esimStatus?: string;
  expiredTime?: string | number | null;
  packageList?: Record<string, unknown>[];
  orderTime?: string | number;
}
export class OrderService {
async getESIMAccessOrders(pageNo: number = 1, pageSize: number = 50) {
    try {
      const settings = await settingsService.getSettings();

      if (!settings.esimAccessCode) {
        throw new AppError(500, "eSIM Access credentials not configured");
      }

      logger.info("[OrderService] Fetching orders from eSIMaccess API...");

      const response = await axios.post(
        "https://api.esimaccess.com/api/v1/open/esim/query",
        {
          pager: {
            pageNo,
            pageSize,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "RT-AccessCode": settings.esimAccessCode,
          },
        }
      );

      if (!response.data.success) {
        throw new AppError(500, "Failed to fetch orders from eSIMaccess");
      }

      logger.info(
        `[OrderService] Retrieved ${response.data.data?.length || 0} orders`
      );
      if (!settings || !settings.profitMargin) {
        throw new Error("Profit margin not configured in settings");
      }
      
      const orders = (response.data.data as ESIMAccessOrder[]).map((esimOrder: ESIMAccessOrder) => {
        const margin = settings.profitMargin;

        return {
          orderNo: esimOrder.orderNo,
          quantity: esimOrder.quantity || 1,
          status: this.mapStatus(esimOrder.esimStatus as string, esimOrder.expiredTime as string | number | null),
          esimStatus: esimOrder.esimStatus,
          expiredTime: esimOrder.expiredTime,
          packageList: esimOrder.packageList || [],
          estimatedProfit: "N/A",
          margin: margin,
          createdAt: esimOrder.orderTime,
        };
      });

      return {
        success: true,
        data: orders,
        total: response.data.data?.length || 0,
        pageNo,
        pageSize,
      };
    } catch (error) {
      logger.error("[OrderService] Error fetching orders", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
private mapStatus(
    esimStatus: string,
    expiredTime: string | number | null
  ): string {
    let expiryDate: Date | null = null;

    if (expiredTime) {
      const timeNum =
        typeof expiredTime === "string" ? parseInt(expiredTime, 10) : expiredTime;

      if (timeNum > 0) {
        const ms =
          timeNum.toString().length === 10 ? timeNum * 1000 : timeNum;
        expiryDate = new Date(ms);
      }
    }

    const now = new Date();
    if (expiryDate && expiryDate < now) {
      return "EXPIRED";
    }
    const statusMap: Record<string, string> = {
      "0": "PENDING",
      "1": "ACTIVATED",
      "2": "USED_UP",
      "3": "EXPIRED",
      "4": "REVOKED",
      "5": "SUSPENDED",
    };

    return statusMap[esimStatus] || "COMPLETED";
  }
async getOrderByOrderNo(orderNo: string) {
    try {
      const orders = await this.getESIMAccessOrders(1, 100);

      const order = orders.data.find((o: Record<string, unknown>) => o.orderNo === orderNo);

      if (!order) {
        throw new AppError(404, "Order not found");
      }

      return order;
    } catch (error) {
      logger.error("[OrderService] Error getting order", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
async createOrder(
    userId: string,
    packageCode: string,
    quantity: number,
    totalAmount: number,
    paymentIntentId: string,
    transactionId?: string
  ) {
    try {
      logger.info(
        `[OrderService] Creating order for user ${userId}: ${packageCode} x${quantity}`
      );

      const orderNo = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const esimCode = this.generateESIMActivationCode();

      const order = await db.order.create({
        data: {
          orderNo,
          userId,
          ...(transactionId && { transactionId }),
          totalAmount, 
          status: "active",
          currency: "USD",
          paymentStatus: "paid",
          metadata: {
            packageCode,
            quantity,
            paymentIntentId,
            esimActivationCode: esimCode,
            esimQRCode: `qr_${esimCode}`,
            purchasedAt: new Date().toISOString(),
          },
        },
      });

      logger.info(
        `[OrderService] Order created: ${order.id} with eSIM code: ${esimCode}`
      );

      return order;
    } catch (error) {
      logger.error(
        "[OrderService] Error creating order",
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
private generateESIMActivationCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "ESIM";

    for (let i = 0; i < 3; i++) {
      let segment = "";
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code += `-${segment}`;
    }

    return code;
  }
async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: "pending" | "paid" | "failed"
  ) {
    try {
      const order = await db.order.update({
        where: { id: orderId },
        data: { paymentStatus },
      });

      logger.info(
        `[OrderService] Order ${orderId} payment status updated to ${paymentStatus}`
      );

      return order;
    } catch (error) {
      logger.error(
        "[OrderService] Error updating order payment status",
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
async getOrderById(orderId: string) {
    try {
      const order = await db.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new AppError(404, "Order not found");
      }

      return order;
    } catch (error) {
      logger.error(
        "[OrderService] Error getting order by ID",
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

export const orderService = new OrderService();



