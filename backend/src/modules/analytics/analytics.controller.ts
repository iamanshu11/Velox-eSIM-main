import { Request, Response } from "express";
import { asyncHandler } from "@utils/errors";
import { sendSuccess, sendError } from "@utils/response";
import { analyticsService } from "./analytics.service";

export const getDashboardMetrics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const metrics = await analyticsService.getDashboardMetrics();
    return sendSuccess(res, "Metrics fetched", metrics);
  },
);

export const getRevenueAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const data = await analyticsService.getRevenueAnalytics();
    return sendSuccess(res, "Revenue data", data);
  },
);

export const getUserGrowth = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const data = await analyticsService.getUserGrowth(
      parseInt(req.query.days as string) || 30,
    );
    return sendSuccess(res, "Growth data", data);
  },
);

export const getPlanPopularity = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await analyticsService.getTopSellingLocations();
    return sendSuccess(res, "Top locations", data);
  },
);

export const getOrderStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const data = await analyticsService.getESIMStatusDistribution();
    return sendSuccess(res, "Order stats", data);
  },
);

export const getPaymentStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const data = await analyticsService.getPaymentStats();
    return sendSuccess(res, "Payment statistics", data);
  },
);

export const getPurchaseOverview = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getPurchaseOverview(days);
    return sendSuccess(res, "Purchase overview", data);
  },
);

export const getActiveESIMOverview = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const data = await analyticsService.getESIMStatusDistribution();
    return sendSuccess(res, "Active eSIM overview", data);
  },
);

export const getNewESIMPurchasedTop10 = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const data = await analyticsService.getTopSellingLocations(10);
    return sendSuccess(res, "New eSIM purchased top 10", data);
  },
);

export const getTopPackages = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await analyticsService.getTopPackages(limit);
    return sendSuccess(res, "Top packages", data);
  },
);

export const getRecentPurchases = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const limit = parseInt(req.query.limit as string) || 5;
    const data = await analyticsService.getRecentPurchases(limit);
    return sendSuccess(res, "Recent purchases", data);
  },
);

export const getPackageAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN")
      return sendError(res, "Admin only", undefined, 403);
    const data = await analyticsService.getTopSellingLocations();
    return sendSuccess(res, "Package analytics by location", data);
  },
);
