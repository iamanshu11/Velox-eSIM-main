import { Request, Response } from "express";
import { asyncHandler } from "@utils/errors";
import logger from "@utils/logger";
import { sendSuccess, sendError } from "@utils/response";
import { webhookService, WebhookPayload } from "./webhook.service";
import statusCode from "http-status-codes";
export const receiveESIMAccessWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const payload: WebhookPayload = req.body;

      if (!payload.notifyType || !payload.content) {
        return sendError(
          res,
          "Invalid webhook payload",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      const webhook = await webhookService.saveWebhook(payload);

      webhookService
        .processWebhook(webhook)
        .catch((error) =>
          logger.error("[Webhook Controller] Processing error", error instanceof Error ? error : new Error(String(error))),
        );

      return sendSuccess(res, "Webhook received and queued for processing", {
        webhookId: webhook.id,
        notifyType: webhook.notifyType,
        notifyId: webhook.notifyId,
      });
    } catch (error: unknown) {
      logger.error("[Webhook Controller] Error receiving webhook", error instanceof Error ? error : new Error(String(error)));
      return sendSuccess(res, "Webhook received", {
        received: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);
export const getWebhookHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return sendError(
          res,
          "Only admins can view webhook history",
          undefined,
          statusCode.FORBIDDEN,
        );
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const webhooks = await webhookService.getWebhookHistory(limit, offset);

      return sendSuccess(res, "Webhook history fetched successfully", {
        webhooks,
        limit,
        offset,
        count: webhooks.length,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch webhook history";
      return sendError(
        res,
        errorMessage,
        undefined,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
export const getPendingWebhooks = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return sendError(
          res,
          "Only admins can view pending webhooks",
          undefined,
          statusCode.FORBIDDEN,
        );
      }

      const webhooks = await webhookService.getUnprocessedWebhooks(50);

      return sendSuccess(res, "Pending webhooks fetched successfully", {
        webhooks,
        count: webhooks.length,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch pending webhooks";
      return sendError(
        res,
        errorMessage,
        undefined,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
export const retryFailedWebhooks = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return sendError(
          res,
          "Only admins can retry webhooks",
          undefined,
          statusCode.FORBIDDEN,
        );
      }

      await webhookService.retryFailedWebhooks();

      return sendSuccess(res, "Failed webhooks retry initiated successfully", {
        success: true,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to retry webhooks";
      return sendError(
        res,
        errorMessage,
        undefined,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
export const webhookHealthCheck = asyncHandler(
  async (_req: Request, res: Response) => {
    return sendSuccess(res, "Webhook receiver is operational", {
      timestamp: new Date().toISOString(),
      status: "online",
      service: "esim-access-webhook-receiver",
    });
  },
);



