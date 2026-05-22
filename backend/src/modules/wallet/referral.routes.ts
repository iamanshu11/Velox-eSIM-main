import { Router, Request, Response } from "express";
import { authenticate } from "@middleware/auth";
import statusCode from "http-status-codes";
import { sendError, sendSuccess } from "@/utils/response";
import { asyncHandler } from "@utils/errors";
import { ReferralService } from "./referral.service";

const router = Router();
router.post(
  "/referral/generate",
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

      const { discount, maxUses, expiresAt } = req.body;

      if (!discount || discount <= 0) {
        return sendError(
          res,
          "Invalid discount",
          "Discount must be greater than 0",
          statusCode.BAD_REQUEST,
        );
      }

      const code = await ReferralService.createReferralCode({
        userId,
        discount,
        maxUses: maxUses || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      return sendSuccess(res, "Referral code generated", code, statusCode.CREATED);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to generate referral code";
      return sendError(
        res,
        "Failed to generate referral code",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/referral/my-codes",
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

      const codes = await ReferralService.getUserReferralCodes(userId);

      return sendSuccess(res, "Referral codes fetched", codes);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch referral codes";
      return sendError(
        res,
        "Failed to fetch referral codes",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/referral/validate/:code",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      const result = await ReferralService.validateReferralCode(code);

      return sendSuccess(res, "Referral code validated", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Invalid referral code";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Invalid referral code",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      return sendError(
        res,
        "Invalid referral code",
        errorMsg,
        statusCode.BAD_REQUEST,
      );
    }
  }),
);
router.post(
  "/referral/redeem",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { referralCodeId } = req.body;

      if (!userId) {
        return sendError(
          res,
          "Unauthorized",
          "User ID not found",
          statusCode.UNAUTHORIZED,
        );
      }

      if (!referralCodeId) {
        return sendError(
          res,
          "Missing referral code ID",
          "referralCodeId is required",
          statusCode.BAD_REQUEST,
        );
      }

      const result = await ReferralService.redeemReferralCode(referralCodeId, userId);

      return sendSuccess(res, "Referral code redeemed", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to redeem referral code";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Referral code not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      return sendError(
        res,
        "Failed to redeem referral code",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/referral/stats",
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

      const stats = await ReferralService.getReferralStats(userId);

      return sendSuccess(res, "Referral statistics fetched", stats);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch statistics";
      return sendError(
        res,
        "Failed to fetch statistics",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.patch(
  "/referral/:codeId/deactivate",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { codeId } = req.params;
      const userId = req.user?.userId;

      const result = await ReferralService.deactivateReferralCode(codeId, userId);

      return sendSuccess(res, "Referral code deactivated", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to deactivate referral code";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Referral code not found",
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
        "Failed to deactivate referral code",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.patch(
  "/referral/:codeId/activate",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { codeId } = req.params;
      const userId = req.user?.userId;

      const result = await ReferralService.activateReferralCode(codeId, userId);

      return sendSuccess(res, "Referral code activated", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to activate referral code";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Referral code not found",
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
        "Failed to activate referral code",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.delete(
  "/referral/:codeId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { codeId } = req.params;
      const userId = req.user?.userId;

      const result = await ReferralService.deleteReferralCode(codeId, userId);

      return sendSuccess(res, "Referral code deleted", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete referral code";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Referral code not found",
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
        "Failed to delete referral code",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/referral/admin/top-referrers",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const isAdmin = req.user?.role === "ADMIN";

      if (!isAdmin) {
        return sendError(
          res,
          "Forbidden",
          "Only admins can view top referrers",
          statusCode.FORBIDDEN,
        );
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const topReferrers = await ReferralService.getTopReferrers(limit);

      return sendSuccess(res, "Top referrers fetched", topReferrers);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch top referrers";
      return sendError(
        res,
        "Failed to fetch top referrers",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);

export default router;
