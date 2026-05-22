import { Request, Response } from "express";
import { asyncHandler } from "@utils/errors";
import logger from "@utils/logger";
import { sendSuccess, sendError } from "@utils/response";
import { settingsService } from "./settings.service";
import emailService from "@utils/email";

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  return sendSuccess(res, "Settings fetched successfully", settings);
});

export const getProfitMargin = asyncHandler(
  async (_req: Request, res: Response) => {
    const margin = await settingsService.getProfitMargin();
    return sendSuccess(res, "Profit margin fetched successfully", {
      profitMargin: margin,
    });
  },
);

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return sendError(res, "Only admins can update settings", undefined, 403);
    }

    try {
      const {
        profitMargin,
        currency,
        maintenanceMode,
        supportEmail,
        esimAccessCode,
        esimSecretKey,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpFromEmail,
        smtpFromName,
        smtpSecure,
      } = req.body;

      const settings = await settingsService.updateSettings({
        ...(profitMargin !== undefined && { profitMargin }),
        ...(currency && { currency }),
        ...(maintenanceMode !== undefined && { maintenanceMode }),
        ...(supportEmail && { supportEmail }),
        ...(esimAccessCode !== undefined && { esimAccessCode }),
        ...(esimSecretKey !== undefined && { esimSecretKey }),
        ...(smtpHost && { smtpHost }),
        ...(smtpPort && { smtpPort }),
        ...(smtpUser && { smtpUser }),
        ...(smtpPassword && { smtpPassword }),
        ...(smtpFromEmail && { smtpFromEmail }),
        ...(smtpFromName && { smtpFromName }),
        ...(smtpSecure !== undefined && { smtpSecure }),
      });

      return sendSuccess(res, "Settings updated successfully", settings);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("[SettingsController] Update error", err);
      return sendError(
        res,
        err.message || "Failed to update settings",
        undefined,
        500,
      );
    }
  },
);

export const updateProfitMargin = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return sendError(res, "Only admins can update settings", undefined, 403);
    }

    const { profitMargin } = req.body;

    if (!profitMargin || typeof profitMargin !== "number") {
      return sendError(res, "Invalid profit margin value", undefined, 400);
    }

    const settings = await settingsService.updateProfitMargin(profitMargin);
    return sendSuccess(res, "Profit margin updated successfully", settings);
  },
);

export const testSMTP = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return sendError(res, "Only admins can test SMTP", undefined, 403);
    }

    try {
      const {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpFromEmail,
        smtpSecure,
      } = req.body;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFromEmail) {
        return sendError(res, "Missing SMTP configuration fields", undefined, 400);
      }

      const result = await emailService.sendEmail(
        smtpFromEmail,
        {
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPassword,
          smtpFromEmail,
          smtpSecure: smtpSecure ?? true,
        },
        "SMTP Test",
        "SMTP configuration test completed successfully!",
      );

      if (result) {
        return sendSuccess(res, "SMTP connection successful!", { success: true, message: "Test email sent successfully" });
      } else {
        return sendError(res, "Failed to send test email", undefined, 500);
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("[SettingsController] SMTP test error", err);
      return sendError(
        res,
        `SMTP test failed: ${err.message}`,
        undefined,
        500,
      );
    }
  },
);

export const testEmail = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return sendError(res, "Only admins can send test emails", undefined, 403);
    }

    try {
      const {
        to,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpFromEmail,
        smtpFromName,
        smtpSecure,
      } = req.body;

      if (!to || !smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFromEmail) {
        return sendError(res, "Missing required fields", undefined, 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return sendError(res, "Invalid email address", undefined, 400);
      }

      const result = await emailService.sendEmail(
        to,
        {
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPassword,
          smtpFromEmail,
          smtpFromName: smtpFromName || "Velox eSIM",
          smtpSecure: smtpSecure ?? true,
        },
        "Test Email from Velox eSIM",
        "This is a test email to verify your SMTP configuration is working correctly.",
      );

      if (result) {
        return sendSuccess(res, "Test email sent successfully!", { success: true, message: `Email sent to ${to}` });
      } else {
        return sendError(res, "Failed to send test email", undefined, 500);
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("[SettingsController] Test email error", err);
      return sendError(
        res,
        `Failed to send test email: ${err.message}`,
        undefined,
        500,
      );
    }
  },
);
