import db from "@config/database";
import { WebhookEvent } from "@prisma/client";
import logger from "@/utils/logger";
import { WebhookContent } from "@/types";
import { toError, getErrorMessage } from "@/utils/errors";

export interface WebhookPayload {
  notifyType:
    | "ORDER_STATUS"
    | "SMDP_EVENT"
    | "ESIM_STATUS"
    | "DATA_USAGE"
    | "VALIDITY_USAGE"
    | "CHECK_HEALTH";
  eventGenerateTime?: string;
  notifyId?: string;
  content: WebhookContent;
}
export const saveWebhook = async (
  payload: WebhookPayload,
): Promise<WebhookEvent> => {
  try {
    const webhook = await db.webhookEvent.create({
      data: {
        notifyType: payload.notifyType,
        notifyId: payload.notifyId || `${Date.now()}`,
        esimOrderId: payload.content?.esimOrderId,
        orderNo: payload.content?.orderNo,
        esimTranNo: payload.content?.esimTranNo,
        iccid: payload.content?.iccid,
        content: payload.content,
        processed: false,
        retryCount: 0,
      },
    });

    return webhook;
  } catch (error: unknown) {
    logger.error("[Webhook Service] Error saving webhook", toError(error));
    throw error;
  }
};
export const getUnprocessedWebhooks = async (
  limit: number = 50,
): Promise<WebhookEvent[]> => {
  try {
    return await db.webhookEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  } catch (error: unknown) {
    logger.error(
      "[Webhook Service] Error fetching unprocessed webhooks",
      toError(error),
    );
    throw error;
  }
};
export const markAsProcessed = async (
  webhookId: string,
  success: boolean = true,
  error?: string,
): Promise<WebhookEvent> => {
  try {
    interface WebhookUpdateData {
      processed: boolean;
      processedAt: Date;
      errorMessage?: string;
      retryCount?: { increment: number };
    }
    const data: WebhookUpdateData = {
      processed: success,
      processedAt: new Date(),
    };

    if (!success && error) {
      data.errorMessage = error;
      data.retryCount = { increment: 1 };
    }

    return await db.webhookEvent.update({
      where: { id: webhookId },
      data,
    });
  } catch (error: unknown) {
    logger.error("[Webhook Service] Error marking webhook processed", toError(error));
    throw error;
  }
};
const handleOrderStatusChange = async (
  webhook: WebhookEvent,
): Promise<void> => {
  try {
    const content = webhook.content as WebhookContent;
    const { orderNo, status } = content;

    if (!orderNo) {
      logger.info("[Webhook Service] No orderNo in webhook content, skipping");
      return;
    }

    const order = await db.order.findFirst({
      where: { id: orderNo },
    });

    if (order) {
      const statusMap: Record<string, string> = {
        SUBMITTED: "PENDING",
        PAYMENT_COMPLETED: "CONFIRMED",
        ACTIVATED: "ACTIVATED",
        EXPIRED: "EXPIRED",
        CANCELLED: "CANCELLED",
      };

      const statusStr = status as string | undefined;
      const mappedStatus =
        (statusStr && statusMap[statusStr]) || statusStr?.toUpperCase() || "PENDING";

      await db.order.update({
        where: { id: order.id },
        data: { status: mappedStatus as string },
      });

      logger.info(
        `[Webhook Service] Order ${orderNo} status updated to ${mappedStatus}`,
      );
    }
  } catch (error) {
    logger.error(
      "[Webhook Service] Error handling order status change",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};
const handleESIMStatusChange = async (webhook: WebhookEvent): Promise<void> => {
  try {
    const content = webhook.content as WebhookContent;
    const { esimTranNo, iccid, status } = content;

    if (!esimTranNo && !iccid) {
      logger.info(
        "[Webhook Service] No esimTranNo or iccid in webhook content, skipping",
      );
      return;
    }

    const statusMap: Record<string, string> = {
      ACTIVE: "ACTIVE",
      INACTIVE: "INACTIVE",
      SUSPENDED: "SUSPENDED",
      REVOKED: "REVOKED",
    };

    const statusStr = status as string | undefined;
    const mappedStatus = (statusStr && statusMap[statusStr]) || statusStr?.toUpperCase() || "ACTIVE";

    logger.info(
      `[Webhook Service] eSIM ${esimTranNo || iccid} status updated to ${mappedStatus}`,
    );
  } catch (error) {
    logger.error(
      "[Webhook Service] Error handling ESIM status update",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};
const handleDataUsageUpdate = async (webhook: WebhookEvent): Promise<void> => {
  try {
    const content = webhook.content as WebhookContent;
    const { esimTranNo, iccid, dataUsed, dataRemaining } = content;

    if (!esimTranNo && !iccid) {
      logger.info(
        "[Webhook Service] No esimTranNo or iccid in webhook content, skipping",
      );
      return;
    }

    logger.info(
      `[Webhook Service] Data Usage Update - Used: ${dataUsed}, Remaining: ${dataRemaining}`,
    );
  } catch (error) {
    logger.error("[Webhook Service] Error handling data usage update", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};
const handleValidityUpdate = async (webhook: WebhookEvent): Promise<void> => {
  try {
    const content = webhook.content as WebhookContent;
    const { esimTranNo, iccid, expiryDate, daysRemaining } = content;

    if (!esimTranNo && !iccid) {
      logger.info(
        "[Webhook Service] No esimTranNo or iccid in webhook content, skipping",
      );
      return;
    }

    logger.info(
      `[Webhook Service] Validity Update - Expires: ${expiryDate}, Days Remaining: ${daysRemaining}`,
    );
  } catch (error) {
    logger.error("[Webhook Service] Error handling validity update", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};
const handleSMDPEvent = async (webhook: WebhookEvent): Promise<void> => {
  try {
    const content = webhook.content as WebhookContent;
    const { smdpEvent, smdpStatus } = content;

    logger.info(
      `[Webhook Service] SMDP Event - Event: ${smdpEvent}, Status: ${smdpStatus}`,
    );
  } catch (error) {
    logger.error("[Webhook Service] Error handling SMDP event", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};
export const processWebhook = async (webhook: WebhookEvent): Promise<void> => {
  try {
    switch (webhook.notifyType) {
      case "ORDER_STATUS":
        await handleOrderStatusChange(webhook);
        break;
      case "ESIM_STATUS":
        await handleESIMStatusChange(webhook);
        break;
      case "DATA_USAGE":
        await handleDataUsageUpdate(webhook);
        break;
      case "VALIDITY_USAGE":
        await handleValidityUpdate(webhook);
        break;
      case "SMDP_EVENT":
        await handleSMDPEvent(webhook);
        break;
      default:
        logger.warn(
          `[Webhook Service] Unknown webhook type: ${webhook.notifyType}`,
        );
    }

    await markAsProcessed(webhook.id, true);
  } catch (error: unknown) {
    logger.error(
      "[Webhook Service] Error processing webhook",
      toError(error),
    );
    await markAsProcessed(
      webhook.id,
      false,
      getErrorMessage(error),
    );
    throw error;
  }
};
export const retryFailedWebhooks = async (): Promise<void> => {
  try {
    const failedWebhooks = await db.webhookEvent.findMany({
      where: {
        processed: false,
        retryCount: { lt: 5 },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    for (const webhook of failedWebhooks) {
      try {
        await processWebhook(webhook);
      } catch (error) {
        logger.error(
          `[Webhook Service] Retry processing webhook ${webhook.id} failed`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
  } catch (error) {
    logger.error("[Webhook Service] Error in retry failed webhooks", error instanceof Error ? error : new Error(String(error)));
  }
};
export const getWebhookHistory = async (
  limit: number = 50,
  offset: number = 0,
): Promise<WebhookEvent[]> => {
  try {
    return await db.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  } catch (error: unknown) {
    logger.error("[Webhook Service] Error fetching webhook history", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};
export const webhookService = {
  saveWebhook,
  getUnprocessedWebhooks,
  markAsProcessed,
  processWebhook,
  retryFailedWebhooks,
  getWebhookHistory,
};



