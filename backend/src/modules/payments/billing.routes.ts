import { Router, Request, Response } from "express";
import { authenticate } from "@middleware/auth";
import statusCode from "http-status-codes";
import { sendError, sendSuccess } from "@/utils/response";
import { asyncHandler } from "@utils/errors";
import { BillingService } from "./billing.service";

const router = Router();
router.get(
  "/statement",
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

      const month = req.query.month ? new Date(req.query.month as string) : new Date();

      const statement = await BillingService.getMonthlyStatement(userId, month);

      return sendSuccess(res, "Monthly statement fetched", statement);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch statement";
      return sendError(
        res,
        "Failed to fetch statement",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/statements",
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

      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 12;

      const result = await BillingService.getUserStatements(userId, { skip, take });

      return sendSuccess(res, "Billing statements fetched", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch statements";
      return sendError(
        res,
        "Failed to fetch statements",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/summary",
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

      const summary = await BillingService.getBillingSummary(userId);

      return sendSuccess(res, "Billing summary fetched", summary);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch summary";
      return sendError(
        res,
        "Failed to fetch summary",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/annual",
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

      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const report = await BillingService.getAnnualReport(userId, year);

      return sendSuccess(res, "Annual report fetched", report);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch annual report";
      return sendError(
        res,
        "Failed to fetch annual report",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/alerts",
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

      const alerts = await BillingService.getBillingAlerts(userId);

      return sendSuccess(res, "Billing alerts fetched", alerts);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch alerts";
      return sendError(
        res,
        "Failed to fetch alerts",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/export/csv",
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

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const csv = await BillingService.exportStatementAsCSV({
        userId,
        startDate,
        endDate,
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="billing-statement-${startDate.toISOString().split("T")[0]}.csv"`,
      );

      return res.send(csv);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to export statement";
      return sendError(
        res,
        "Failed to export statement",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);

export default router;
