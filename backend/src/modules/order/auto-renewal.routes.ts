import { Router, Request, Response } from "express";
import { authenticate } from "@middleware/auth";
import statusCode from "http-status-codes";
import { sendError, sendSuccess } from "@/utils/response";
import { asyncHandler } from "@utils/errors";
import { AutoRenewalService } from "./auto-renewal.service";

interface AutoRenewal {
  id: string;
  userId: string;
  esimId: string;
  enabled: boolean;
  nextScheduledRenewal: Date | null;
  lastRenewalAt: Date | null;
  renewalDaysBefore: number;
  autoPayFromWallet: boolean;
  maxAutoRenewals: number;
  renewalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const router = Router();
router.get(
  "/auto-renewal/list",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
      }
      const renewals = await AutoRenewalService.getUserAutoRenewals(userId);
      return sendSuccess(res, "Auto-renewals fetched successfully", renewals);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch auto-renewals";
      return sendError(res, "Failed to fetch auto-renewals", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  }),
);
router.get(
  "/auto-renewal/upcoming",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
      }
      const daysAhead = parseInt(req.query.daysAhead as string) || 7;
      const upcomingRenewals = await AutoRenewalService.getUpcomingRenewals(daysAhead);
      const userRenewals = upcomingRenewals.filter((r: AutoRenewal) => r.userId === userId);
      return sendSuccess(res, "Upcoming renewals fetched successfully", userRenewals);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch upcoming renewals";
      return sendError(res, "Failed to fetch upcoming renewals", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  }),
);
router.post(
  "/auto-renewal/create",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(
          res,
          "Unauthorized",
          "User ID not found",
          statusCode.UNAUTHORIZED,
        );
      }

      const { esimId, renewalDaysBefore, autoPayFromWallet, maxAutoRenewals } = req.body;

      if (!esimId) {
        return sendError(
          res,
          "Missing required fields",
          "esimId is required",
          statusCode.BAD_REQUEST,
        );
      }

      const renewal = await AutoRenewalService.createAutoRenewal({
        userId,
        esimId,
        renewalDaysBefore: renewalDaysBefore || 5,
        autoPayFromWallet: autoPayFromWallet ?? true,
        maxAutoRenewals: maxAutoRenewals || 12,
      });

      return sendSuccess(res, "Auto-renewal created successfully", renewal, statusCode.CREATED);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create auto-renewal";
      return sendError(
        res,
        "Failed to create auto-renewal",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/auto-renewal/:autoRenewalId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { autoRenewalId } = req.params;
      const userId = req.user?.userId;

      const renewal = await AutoRenewalService.getAutoRenewal(autoRenewalId, userId);

      return sendSuccess(res, "Auto-renewal fetched successfully", renewal);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch auto-renewal";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Auto-renewal not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      if (errorMsg.includes("Unauthorized")) {
        return sendError(
          res,
          "Unauthorized",
          errorMsg,
          statusCode.FORBIDDEN,
        );
      }

      return sendError(
        res,
        "Failed to fetch auto-renewal",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.patch(
  "/auto-renewal/:autoRenewalId/update",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { autoRenewalId } = req.params;
      const userId = req.user?.userId;

      await AutoRenewalService.getAutoRenewal(autoRenewalId, userId);

      const updated = await AutoRenewalService.updateAutoRenewal({
        autoRenewalId,
        enabled: req.body.enabled,
        renewalDaysBefore: req.body.renewalDaysBefore,
        autoPayFromWallet: req.body.autoPayFromWallet,
        maxAutoRenewals: req.body.maxAutoRenewals,
      });

      return sendSuccess(res, "Auto-renewal updated successfully", updated);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update auto-renewal";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Auto-renewal not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      if (errorMsg.includes("Unauthorized")) {
        return sendError(
          res,
          "Unauthorized",
          errorMsg,
          statusCode.FORBIDDEN,
        );
      }

      return sendError(
        res,
        "Failed to update auto-renewal",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.post(
  "/auto-renewal/:autoRenewalId/enable",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { autoRenewalId } = req.params;
      const userId = req.user?.userId;

      await AutoRenewalService.getAutoRenewal(autoRenewalId, userId);

      const renewal = await AutoRenewalService.enableAutoRenewal(autoRenewalId);

      return sendSuccess(res, "Auto-renewal enabled successfully", renewal);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to enable auto-renewal";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Auto-renewal not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      if (errorMsg.includes("Unauthorized")) {
        return sendError(
          res,
          "Unauthorized",
          errorMsg,
          statusCode.FORBIDDEN,
        );
      }

      return sendError(
        res,
        "Failed to enable auto-renewal",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.post(
  "/auto-renewal/:autoRenewalId/disable",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { autoRenewalId } = req.params;
      const userId = req.user?.userId;

      await AutoRenewalService.getAutoRenewal(autoRenewalId, userId);

      const renewal = await AutoRenewalService.disableAutoRenewal(autoRenewalId);

      return sendSuccess(res, "Auto-renewal disabled successfully", renewal);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to disable auto-renewal";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Auto-renewal not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      if (errorMsg.includes("Unauthorized")) {
        return sendError(
          res,
          "Unauthorized",
          errorMsg,
          statusCode.FORBIDDEN,
        );
      }

      return sendError(
        res,
        "Failed to disable auto-renewal",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.delete(
  "/auto-renewal/:autoRenewalId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { autoRenewalId } = req.params;
      const userId = req.user?.userId;

      await AutoRenewalService.getAutoRenewal(autoRenewalId, userId);

      const renewal = await AutoRenewalService.deleteAutoRenewal(autoRenewalId);

      return sendSuccess(res, "Auto-renewal deleted successfully", renewal);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete auto-renewal";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Auto-renewal not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      if (errorMsg.includes("Unauthorized")) {
        return sendError(
          res,
          "Unauthorized",
          errorMsg,
          statusCode.FORBIDDEN,
        );
      }

      return sendError(
        res,
        "Failed to delete auto-renewal",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);

export default router;

