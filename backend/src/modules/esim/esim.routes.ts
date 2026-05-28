import { Router, Request, Response } from "express";
import { authenticate, authorize } from "@middleware/auth";
import statusCode from "http-status-codes";
import logger from "@utils/logger";
import { esimAccessService, esimService, Location } from "./esim.service";
import { searchPlansByCountry, getAllCountries } from "./search.service";
import { sendError, sendSuccess } from "@/utils/response";
import { asyncHandler } from "@/utils/errors";
import { getAllDataPackages } from "./esim.controller";
import { settingsService } from "@modules/settings/settings.service";
import { walletService } from "@modules/wallet/wallet.service";
import db from "@config/database";

const router = Router();
router.get(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const limit = Math.min(
        Math.max(1, parseInt(req.query.limit as string) || 10),
        50,
      );

      if (!query || query.trim().length < 2) {
        return sendError(
          res,
          "Invalid search query",
          "Query must be at least 2 characters",
          statusCode.BAD_REQUEST,
        );
      }

      const results = await searchPlansByCountry(query.trim(), limit);

      return sendSuccess(res, "Plans search successful", results);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Search failed";
      logger.error("[eSIMs Search] Error:", error);
      return sendError(
        res,
        "Search failed",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/countries/autocomplete",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const countries = await getAllCountries();
      return sendSuccess(res, "Countries fetched successfully", countries);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch countries";
      logger.error("[eSIMs Countries] Error:", error);
      return sendError(
        res,
        "Failed to fetch countries",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/popular",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = Math.min(
        Math.max(1, parseInt(req.query.limit as string) || 12),
        50,
      );

      const result = await esimService.getPopularPackages(limit);
      return sendSuccess(res, "Popular packages fetched successfully", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to fetch popular packages";
      logger.error("[eSIMs Popular] Error:", error);
      return sendError(
        res,
        "Failed to fetch popular packages",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/by-region",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const region = (req.query.region as string) || undefined;
      const limit = Math.max(1, parseInt(req.query.limit as string) || 100);

      const result = await esimService.getPackagesByRegion(region, limit);
      return sendSuccess(res, "Regional packages fetched successfully", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to fetch regional packages";
      logger.error("[eSIMs By-Region] Error:", error);
      return sendError(
        res,
        "Failed to fetch regional packages",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);


router.get(
  "/validate-credentials",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const result = await esimAccessService.validateCredentials();
      res.status(statusCode.OK).json({
        success: result,
        message: result ? "Credentials valid" : "Invalid credentials",
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Validation failed";
      res.status(statusCode.BAD_REQUEST).json({
        success: false,
        error: errorMsg,
      });
    }
  },
);
router.get(
  "/balance",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const rawBalance = await esimAccessService.getAccountBalance();
      const formattedBalance = rawBalance.balance / 10000;
      res.status(statusCode.OK).json({
        success: true,
        data: {
          balance: formattedBalance,
        },
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch balance";
      res.status(statusCode.BAD_REQUEST).json({
        success: false,
        error: errorMsg,
      });
    }
  },
);
router.get("/countries", async (req: Request, res: Response) => {
  try {
    const countries = await esimAccessService.getSupportedLocations();
    res.status(statusCode.OK).json({
      success: true,
      data: countries,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch countries";
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: errorMsg,
    });
  }
});
router.get(
  "/packages",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);

      const settings = await settingsService.getSettings();

      if (!settings) {
        return sendError(
          res,
          "Configuration Error",
          "Settings not configured in database",
          statusCode.INTERNAL_SERVER_ERROR,
        );
      }

      if (
        settings.profitMargin === null ||
        settings.profitMargin === undefined
      ) {
        return sendError(
          res,
          "Configuration Error",
          "Profit margin not configured. Please set profit margin in admin settings.",
          statusCode.INTERNAL_SERVER_ERROR,
        );
      }

      const profitMargin = settings.profitMargin;

      const locationCode = (req.query.locationCode as string) || undefined;

      const packages = await esimAccessService.getAllDataPackages(
        locationCode ? { locationCode } : undefined,
        page,
        limit,
      );

      const packageArray = Array.isArray(packages) ? packages : [];

      const packagesWithMargin = packageArray.map((pkg: any) => {
        const wholesalePriceInCents = Math.round((pkg.price as number) / 100);
        const retailPriceInCents = Math.round(
          wholesalePriceInCents * profitMargin,
        );

        return {
          ...pkg,
          wholesalePrice: wholesalePriceInCents,
          price: retailPriceInCents,
        };
      });

      const total = packagesWithMargin.length;
      const totalPages = Math.ceil(total / limit);
      const startIdx = (page - 1) * limit;
      const paginatedPackages = packagesWithMargin.slice(
        startIdx,
        startIdx + limit,
      );

      return sendSuccess(res, "Packages fetched successfully", {
        packages: paginatedPackages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
        profitMarginApplied: profitMargin,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch packages";
      logger.error("[eSIMs] Error fetching packages:", error);
      return sendError(
        res,
        "Failed to fetch packages",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get("/plans", getAllDataPackages);
router.get(
  "/esimaccess/orders",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const pageNum = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(
        50,
        parseInt(req.query.pageSize as string) || 20,
      );

      const orders = await esimAccessService.queryESIMProfiles(
        pageNum,
        pageSize,
      );

      res.status(statusCode.OK).json({
        success: true,
        data: orders.esimList || [],
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch orders";
      res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: errorMsg,
      });
    }
  },
);
router.get(
  "/dashboard/account",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const [balanceData, profilesData, locationsData] = await Promise.all([
        esimAccessService.getAccountBalance(),
        esimAccessService.queryESIMProfiles(1, 100),
        esimAccessService.getSupportedLocations(),
      ]);

      const accountBalance = {
        balance: balanceData.balance / 10000,
        currency: "USD",
        lastUpdatedTime: new Date().toISOString(),
      };

      const profiles = {
        esimList: Array.isArray(profilesData?.esimList)
          ? profilesData.esimList
          : [],
      };

      const locations = {
        locationList: Array.isArray(locationsData)
          ? locationsData.map((loc: Location) => ({
              code: loc.code,
              name: loc.name,
              country: loc.name,
            }))
          : [],
      };

      res.status(statusCode.OK).json({
        success: true,
        data: {
          balance: accountBalance,
          totalProfiles: profilesData?.pager?.total || 0,
          totalLocations: locationsData?.length || 0,
          profiles,
          locations,
        },
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard account";
      res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: errorMsg,
      });
    }
  },
);
router.get(
  "/dashboard/profiles",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const pageNum = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(
        100,
        parseInt(req.query.pageSize as string) || 50,
      );

      const profilesResponse = await esimAccessService.queryESIMProfiles(
        pageNum,
        pageSize,
      );
      const profiles = Array.isArray(profilesResponse?.esimList)
        ? profilesResponse.esimList
        : [];
      const total = profilesResponse?.pager?.total ?? profiles.length;

      res.status(statusCode.OK).json({
        success: true,
        data: {
          esimList: profiles,
          pageNum,
          pageSize,
          total,
        },
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch profiles";
      res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: errorMsg,
      });
    }
  },
);
router.get(
  "/dashboard/summary",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const balance = await esimAccessService.getAccountBalance();
      const orders = await esimAccessService.queryESIMProfiles(1, 10);
      const countries = await esimAccessService.getSupportedLocations();

      res.status(statusCode.OK).json({
        success: true,
        data: {
          balance,
          recentOrders: orders.esimList || [],
          countriesCount: countries.length,
        },
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch dashboard";
      res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: errorMsg,
      });
    }
  },
);
router.get(
  "/profiles/:orderNo",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { orderNo } = req.params;
      const requestingUserId = req.user?.userId;
      const requestingRole = req.user?.role;

      if (!orderNo) {
        return sendError(
          res,
          "Order number is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      if (requestingRole !== "ADMIN" && requestingRole !== "SUPER_ADMIN") {
        const linkedOrderRows = await db.$queryRaw<Array<{ user_id: string }>>`
          SELECT "userId" AS user_id
          FROM orders
          WHERE metadata->>'externalOrderNo' = ${orderNo}
             OR "orderNo" = ${orderNo}
          LIMIT 1
        `;

        const ownerUserId = linkedOrderRows[0]?.user_id;

        if (!ownerUserId || ownerUserId !== requestingUserId) {
          return sendError(
            res,
            "Insufficient permissions",
            "You do not have access to this order's eSIM profiles",
            statusCode.FORBIDDEN,
          );
        }
      }

      const profiles = await esimAccessService.getProfileByOrderNo(orderNo);

      return sendSuccess(
        res,
        "Profiles fetched successfully",
        profiles,
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch profiles";
      logger.error("[eSIM] Error fetching profiles:", error);
      return sendError(
        res,
        "Failed to fetch profiles",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/purchase",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const { amount, packageInfoList } = req.body;

      if (!userId) {
        return sendError(res, "Unauthorized", "", statusCode.UNAUTHORIZED);
      }

      if (
        !packageInfoList ||
        !Array.isArray(packageInfoList) ||
        packageInfoList.length === 0
      ) {
        return sendError(
          res,
          "Invalid request",
          "packageInfoList is required and must be a non-empty array",
          statusCode.BAD_REQUEST,
        );
      }

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return sendError(
          res,
          "Invalid amount",
          "Amount is required and must be greater than 0",
          statusCode.BAD_REQUEST,
        );
      }

      const amountInDollars = amount > 100 ? amount / 100 : amount;

      logger.debug(
        `[eSIM Purchase] User ${userId} attempting purchase: $${amountInDollars}`,
      );

      const hasSufficientBalance = await walletService.hasSufficientBalance(
        userId,
        amountInDollars,
      );
      if (!hasSufficientBalance) {
        const balance = await walletService.getBalance(userId);
        return sendError(
          res,
          "Insufficient balance",
          `Wallet balance: $${balance}, Required: $${amountInDollars}`,
          statusCode.PAYMENT_REQUIRED,
        );
      }

      // Deduct wallet FIRST so funds are reserved before the external API call.
      // If the eSIMaccess order fails we refund immediately in the catch block.
      logger.debug(
        `[eSIM Purchase] Deducting $${amountInDollars} from wallet for user ${userId}`,
      );
      const PENDING_REFERENCE = `PENDING-ESIM-PURCHASE:${userId}:${Date.now()}`;
      const updatedWallet = await walletService.deductFunds(
        userId,
        amountInDollars,
        PENDING_REFERENCE,
        {
          packageCount: packageInfoList.length,
          userEmail,
          status: "pending_esim_order",
        },
      );

      let orderResult: { orderNo: string; transactionId: string };
      try {
        logger.debug(`[eSIM Purchase] Creating order for user ${userId}`);
        orderResult = await esimAccessService.placeOrder({
          amount,
          packageInfoList,
        });

        if (!orderResult || !orderResult.orderNo) {
          throw new Error("Failed to create order on eSIMaccess API");
        }
      } catch (apiError) {
        // External order failed — refund the wallet immediately
        const apiErrMsg =
          apiError instanceof Error ? apiError.message : "eSIMaccess API error";
        logger.error(
          `[eSIM Purchase] eSIMaccess order failed, refunding $${amountInDollars} to user ${userId}:`,
          apiErrMsg,
        );
        try {
          await walletService.addFunds(
            userId,
            amountInDollars,
            `REFUND-${PENDING_REFERENCE}`,
            PENDING_REFERENCE,
          );
        } catch (refundError) {
          logger.error(
            `[eSIM Purchase] CRITICAL: Refund failed for user ${userId} after API error. Manual intervention required.`,
            refundError,
          );
        }
        return sendError(
          res,
          "Failed to place eSIM order",
          apiErrMsg,
          statusCode.INTERNAL_SERVER_ERROR,
        );
      }

      logger.debug(
        `[eSIM Purchase] Order created: ${orderResult.orderNo}, New wallet balance: $${updatedWallet.balance}`,
      );

      return sendSuccess(
        res,
        "eSIM purchased successfully",
        {
          order: orderResult,
          wallet: {
            balance: updatedWallet.balance,
            currency: updatedWallet.currency,
          },
        },
        statusCode.CREATED,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Purchase failed";
      logger.error("[eSIM Purchase] Error:", error);
      return sendError(
        res,
        "Failed to purchase eSIM",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.post(
  "/order",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { amount, packageInfoList } = req.body;

      if (
        !packageInfoList ||
        !Array.isArray(packageInfoList) ||
        packageInfoList.length === 0
      ) {
        return sendError(
          res,
          "packageInfoList is required and must be a non-empty array",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      const result = await esimAccessService.placeOrder({
        amount,
        packageInfoList,
      });

      return sendSuccess(
        res,
        "Order created successfully",
        result,
        statusCode.CREATED,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create order";
      logger.error("[eSIM] Error creating order:", error);
      return sendError(
        res,
        "Failed to create order",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/:esimTranNo/cancel",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { esimTranNo } = req.params;

      if (!esimTranNo) {
        return sendError(
          res,
          "eSIM transaction number is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      const profile =
        await esimAccessService.getProfileByEsimTranNo(esimTranNo);

      if (!profile) {
        return sendError(
          res,
          "eSIM not found",
          "No eSIM profile was found for the provided transaction number",
          statusCode.NOT_FOUND,
        );
      }

      const normalizedEsimStatus = profile.esimStatus?.toUpperCase?.() || "";
      const normalizedSmdpStatus = profile.smdpStatus?.toUpperCase?.() || "";

      if (
        normalizedEsimStatus.includes("CANCEL") ||
        normalizedSmdpStatus === "DELETED"
      ) {
        return sendError(
          res,
          "eSIM already cancelled",
          "This eSIM has already been cancelled or deleted",
          statusCode.CONFLICT,
        );
      }

      const refundReference = `ADMIN-ESIM-CANCEL:${esimTranNo}`;
      const existingRefund = await db.transaction.findFirst({
        where: {
          transactionType: "REFUND",
          reference: refundReference,
          status: "completed",
        },
      });

      if (existingRefund) {
        return sendError(
          res,
          "Refund already processed",
          "This eSIM cancellation has already been refunded",
          statusCode.CONFLICT,
        );
      }

      const externalOrderNo = profile.orderNo;
      const relatedProfiles = externalOrderNo
        ? await esimAccessService
            .getProfileByOrderNo(externalOrderNo)
            .catch(() => [profile])
        : [profile];
      const profileCount = Math.max(relatedProfiles.length || 0, 1);

      const linkedOrderRows = externalOrderNo
        ? await db.$queryRaw<Array<{ id: string }>>`
            SELECT id
            FROM orders
            WHERE metadata->>'externalOrderNo' = ${externalOrderNo}
            LIMIT 1
          `
        : [];

      const linkedOrderId = linkedOrderRows[0]?.id;
      const linkedOrder = linkedOrderId
        ? await db.order.findUnique({
            where: { id: linkedOrderId },
            select: {
              id: true,
              userId: true,
              transactionId: true,
              paymentStatus: true,
              totalAmount: true,
              metadata: true,
            },
          })
        : null;

      if (linkedOrder?.paymentStatus === "refunded") {
        return sendError(
          res,
          "Refund already processed",
          "This order has already been refunded",
          statusCode.CONFLICT,
        );
      }

      const purchaseTransaction = linkedOrder?.transactionId
        ? await db.transaction.findFirst({
            where: {
              OR: [
                {
                  reference: externalOrderNo,
                  transactionType: "ESIM_PURCHASE",
                  status: "completed",
                },
                {
                  id: linkedOrder.transactionId,
                  transactionType: "ESIM_PURCHASE",
                  status: "completed",
                },
              ],
            },
            orderBy: {
              createdAt: "desc",
            },
          })
        : await db.transaction.findFirst({
            where: {
              reference: externalOrderNo,
              transactionType: "ESIM_PURCHASE",
              status: "completed",
            },
            orderBy: {
              createdAt: "desc",
            },
          });

      const targetUserId = purchaseTransaction?.userId || linkedOrder?.userId;
      const totalPurchaseAmount =
        purchaseTransaction?.amount || linkedOrder?.totalAmount || 0;

      if (!targetUserId || !totalPurchaseAmount || totalPurchaseAmount <= 0) {
        return sendError(
          res,
          "Refund source not found",
          "Could not determine the user or paid amount for this eSIM. Cancellation was blocked to avoid losing the refund.",
          statusCode.CONFLICT,
        );
      }

      const refundAmount = Number(
        (totalPurchaseAmount / profileCount).toFixed(2),
      );

      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        return sendError(
          res,
          "Invalid refund amount",
          "Could not calculate a valid refund amount for this eSIM",
          statusCode.CONFLICT,
        );
      }

      await esimAccessService.cancelESIMProfile(esimTranNo);

      try {
        const refundedWallet = await walletService.refund(
          targetUserId,
          refundAmount,
          refundReference,
          `Admin cancelled eSIM ${esimTranNo} from order ${externalOrderNo}`,
        );

        if (linkedOrder) {
          const existingMetadata =
            linkedOrder.metadata && typeof linkedOrder.metadata === "object"
              ? (linkedOrder.metadata as Record<string, unknown>)
              : {};

          await db.order.update({
            where: { id: linkedOrder.id },
            data: {
              paymentStatus: "refunded",
              metadata: {
                ...existingMetadata,
                refundStatus: "completed",
                refundAmount,
                refundReference,
                refundReason: "Admin cancelled eSIM",
                refundTimestamp: new Date().toISOString(),
                cancelledEsimTranNo: esimTranNo,
                cancelledBy: req.user?.userId || null,
              },
            },
          });
        }

        const targetUser = await db.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            email: true,
          },
        });

        await db.notification.create({
          data: {
            userId: targetUserId,
            type: "wallet_refund",
            title: "eSIM Cancelled and Refunded",
            message: `Your eSIM was cancelled by admin and $${refundAmount.toFixed(2)} was returned to your wallet.`,
            metadata: {
              esimTranNo,
              externalOrderNo,
              refundAmount,
              refundReference,
            },
          },
        });

        await db.activityLog.create({
          data: {
            userId: targetUserId,
            action: "ADMIN_ESIM_CANCELLED",
            resource: "esim",
            module: "admin",
            details: `eSIM ${esimTranNo} cancelled. Refund $${refundAmount.toFixed(2)} issued by ${req.user?.userId || "unknown"}`,
            ipAddress: req.ip || null,
            userAgent: req.headers["user-agent"] || null,
          },
        });

        logger.info("[eSIM] Admin cancelled eSIM with refund", {
          esimTranNo,
          externalOrderNo,
          targetUserId,
          targetEmail: targetUser?.email,
          refundedBy: req.user?.userId,
          refundAmount,
          walletBalanceAfter: refundedWallet.balance,
          profileCount,
        });

        return sendSuccess(
          res,
          "eSIM cancelled and refunded successfully",
          {
            esimTranNo,
            orderNo: externalOrderNo,
            refund: {
              amount: refundAmount,
              currency: refundedWallet.currency || "USD",
              reference: refundReference,
              balanceAfter: refundedWallet.balance,
            },
          },
          statusCode.OK,
        );
      } catch (refundError) {
        logger.error("[eSIM] Cancellation succeeded but refund failed", {
          esimTranNo,
          externalOrderNo,
          targetUserId,
          refundAmount,
          refundError:
            refundError instanceof Error
              ? refundError.message
              : String(refundError),
        });

        if (linkedOrder) {
          const existingMetadata =
            linkedOrder.metadata && typeof linkedOrder.metadata === "object"
              ? (linkedOrder.metadata as Record<string, unknown>)
              : {};

          await db.order
            .update({
              where: { id: linkedOrder.id },
              data: {
                paymentStatus: "pending_refund",
                metadata: {
                  ...existingMetadata,
                  refundStatus: "failed",
                  refundAmount,
                  refundReference,
                  refundError:
                    refundError instanceof Error
                      ? refundError.message
                      : String(refundError),
                  manualRefundRequired: true,
                  cancelledEsimTranNo: esimTranNo,
                  cancelledBy: req.user?.userId || null,
                },
              },
            })
            .catch((updateError) => {
              logger.error(
                "[eSIM] Failed to mark pending refund state",
                updateError,
              );
            });
        }

        return sendError(
          res,
          "eSIM cancelled but refund failed",
          "The eSIM was cancelled, but wallet refund failed and requires manual attention.",
          statusCode.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to cancel eSIM";
      logger.error("[eSIM] Error cancelling eSIM:", error);
      return sendError(
        res,
        "Failed to cancel eSIM",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/:esimTranNo/cancel-self",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { esimTranNo } = req.params;
      const requestingUserId = req.user?.userId;

      if (!esimTranNo) {
        return sendError(
          res,
          "eSIM transaction number is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      if (!requestingUserId) {
        return sendError(
          res,
          "Unauthorized",
          "You must be logged in to cancel an eSIM",
          statusCode.UNAUTHORIZED,
        );
      }

      const profile =
        await esimAccessService.getProfileByEsimTranNo(esimTranNo);

      if (!profile) {
        return sendError(
          res,
          "eSIM not found",
          "No eSIM profile was found for the provided transaction number",
          statusCode.NOT_FOUND,
        );
      }

      const normalizedEsimStatus = profile.esimStatus?.toUpperCase?.() || "";
      const normalizedSmdpStatus = profile.smdpStatus?.toUpperCase?.() || "";

      if (
        normalizedEsimStatus.includes("CANCEL") ||
        normalizedSmdpStatus === "DELETED"
      ) {
        return sendError(
          res,
          "eSIM already cancelled",
          "This eSIM has already been cancelled or deleted",
          statusCode.CONFLICT,
        );
      }

      const externalOrderNo = profile.orderNo;

      const linkedOrderRows = externalOrderNo
        ? await db.$queryRaw<Array<{ id: string; user_id: string }>>`
            SELECT id, "userId" AS user_id
            FROM orders
            WHERE metadata->>'externalOrderNo' = ${externalOrderNo}
            LIMIT 1
          `
        : [];

      const linkedOrderId = linkedOrderRows[0]?.id;
      const linkedOrderOwnerId = linkedOrderRows[0]?.user_id;

      if (!linkedOrderId || linkedOrderOwnerId !== requestingUserId) {
        return sendError(
          res,
          "Forbidden",
          "You do not have permission to cancel this eSIM",
          statusCode.FORBIDDEN,
        );
      }

      const linkedOrder = await db.order.findUnique({
        where: { id: linkedOrderId },
        select: {
          id: true,
          userId: true,
          transactionId: true,
          paymentStatus: true,
          totalAmount: true,
          metadata: true,
        },
      });

      if (!linkedOrder) {
        return sendError(
          res,
          "Order not found",
          "Could not find the order associated with this eSIM",
          statusCode.NOT_FOUND,
        );
      }

      if (linkedOrder.paymentStatus === "refunded") {
        return sendError(
          res,
          "Refund already processed",
          "This order has already been refunded",
          statusCode.CONFLICT,
        );
      }

      const refundReference = `USER-ESIM-CANCEL:${esimTranNo}`;
      const existingRefund = await db.transaction.findFirst({
        where: {
          transactionType: "REFUND",
          reference: refundReference,
          status: "completed",
        },
      });

      if (existingRefund) {
        return sendError(
          res,
          "Refund already processed",
          "This eSIM cancellation has already been refunded",
          statusCode.CONFLICT,
        );
      }

      const relatedProfiles = externalOrderNo
        ? await esimAccessService
            .getProfileByOrderNo(externalOrderNo)
            .catch(() => [profile])
        : [profile];
      const profileCount = Math.max(relatedProfiles.length || 0, 1);

      const purchaseTransaction = linkedOrder.transactionId
        ? await db.transaction.findFirst({
            where: {
              OR: [
                {
                  reference: externalOrderNo,
                  transactionType: "ESIM_PURCHASE",
                  status: "completed",
                  userId: requestingUserId,
                },
                {
                  id: linkedOrder.transactionId,
                  transactionType: "ESIM_PURCHASE",
                  status: "completed",
                },
              ],
            },
            orderBy: { createdAt: "desc" },
          })
        : await db.transaction.findFirst({
            where: {
              reference: externalOrderNo,
              transactionType: "ESIM_PURCHASE",
              status: "completed",
              userId: requestingUserId,
            },
            orderBy: { createdAt: "desc" },
          });

      const totalPurchaseAmount =
        purchaseTransaction?.amount || linkedOrder.totalAmount || 0;

      if (!totalPurchaseAmount || totalPurchaseAmount <= 0) {
        return sendError(
          res,
          "Refund source not found",
          "Could not determine the paid amount for this eSIM. Cancellation was blocked to avoid losing the refund.",
          statusCode.CONFLICT,
        );
      }

      const refundAmount = Number(
        (totalPurchaseAmount / profileCount).toFixed(2),
      );

      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        return sendError(
          res,
          "Invalid refund amount",
          "Could not calculate a valid refund amount for this eSIM",
          statusCode.CONFLICT,
        );
      }

      await esimAccessService.cancelESIMProfile(esimTranNo);

      try {
        const refundedWallet = await walletService.refund(
          requestingUserId,
          refundAmount,
          refundReference,
          `User cancelled eSIM ${esimTranNo} from order ${externalOrderNo}`,
        );

        const existingMetadata =
          linkedOrder.metadata && typeof linkedOrder.metadata === "object"
            ? (linkedOrder.metadata as Record<string, unknown>)
            : {};

        await db.order.update({
          where: { id: linkedOrder.id },
          data: {
            paymentStatus: "refunded",
            metadata: {
              ...existingMetadata,
              refundStatus: "completed",
              refundAmount,
              refundReference,
              refundReason: "User cancelled eSIM",
              refundTimestamp: new Date().toISOString(),
              cancelledEsimTranNo: esimTranNo,
              cancelledBy: requestingUserId,
            },
          },
        });

        await db.notification.create({
          data: {
            userId: requestingUserId,
            type: "wallet_refund",
            title: "eSIM Cancelled and Refunded",
            message: `Your eSIM was cancelled and $${refundAmount.toFixed(2)} was returned to your wallet.`,
            metadata: {
              esimTranNo,
              externalOrderNo,
              refundAmount,
              refundReference,
            },
          },
        });

        await db.activityLog.create({
          data: {
            userId: requestingUserId,
            action: "USER_ESIM_CANCELLED",
            resource: "esim",
            module: "esim",
            details: `User cancelled eSIM ${esimTranNo} from order ${externalOrderNo}. Refund $${refundAmount.toFixed(2)} issued.`,
            ipAddress: req.ip || null,
            userAgent: req.headers["user-agent"] || null,
          },
        });

        logger.info("[eSIM] User cancelled eSIM with refund", {
          esimTranNo,
          externalOrderNo,
          requestingUserId,
          refundAmount,
          walletBalanceAfter: refundedWallet.balance,
          profileCount,
        });

        return sendSuccess(
          res,
          "eSIM cancelled and refunded successfully",
          {
            esimTranNo,
            orderNo: externalOrderNo,
            refund: {
              amount: refundAmount,
              currency: refundedWallet.currency || "USD",
              reference: refundReference,
              balanceAfter: refundedWallet.balance,
            },
          },
          statusCode.OK,
        );
      } catch (refundError) {
        logger.error("[eSIM] User cancellation succeeded but refund failed", {
          esimTranNo,
          externalOrderNo,
          requestingUserId,
          refundAmount,
          refundError:
            refundError instanceof Error
              ? refundError.message
              : String(refundError),
        });

        const existingMetadata =
          linkedOrder.metadata && typeof linkedOrder.metadata === "object"
            ? (linkedOrder.metadata as Record<string, unknown>)
            : {};

        await db.order
          .update({
            where: { id: linkedOrder.id },
            data: {
              paymentStatus: "pending_refund",
              metadata: {
                ...existingMetadata,
                refundStatus: "failed",
                refundAmount,
                refundReference,
                refundError:
                  refundError instanceof Error
                    ? refundError.message
                    : String(refundError),
                manualRefundRequired: true,
                cancelledEsimTranNo: esimTranNo,
                cancelledBy: requestingUserId,
              },
            },
          })
          .catch((updateError) => {
            logger.error(
              "[eSIM] Failed to mark pending refund state",
              updateError,
            );
          });

        return sendError(
          res,
          "eSIM cancelled but refund failed",
          "The eSIM was cancelled, but wallet refund failed and requires manual attention.",
          statusCode.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to cancel eSIM";
      logger.error("[eSIM] Error cancelling eSIM (user self-cancel):", error);
      return sendError(
        res,
        "Failed to cancel eSIM",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/:iccid/suspend",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { iccid } = req.params;

      if (!iccid) {
        return sendError(
          res,
          "ICCID is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      await esimAccessService.suspendESIMProfile(iccid);

      return sendSuccess(
        res,
        "eSIM suspended successfully",
        { iccid },
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to suspend eSIM";
      logger.error("[eSIM] Error suspending eSIM:", error);
      return sendError(
        res,
        "Failed to suspend eSIM",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/:iccid/unsuspend",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { iccid } = req.params;

      if (!iccid) {
        return sendError(
          res,
          "ICCID is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      await esimAccessService.unsuspendESIMProfile(iccid);

      return sendSuccess(
        res,
        "eSIM unsuspended successfully",
        { iccid },
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to unsuspend eSIM";
      logger.error("[eSIM] Error unsuspending eSIM:", error);
      return sendError(
        res,
        "Failed to unsuspend eSIM",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/:iccid/revoke",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { iccid } = req.params;

      if (!iccid) {
        return sendError(
          res,
          "ICCID is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      await esimAccessService.revokeESIMProfile(iccid);

      return sendSuccess(
        res,
        "eSIM revoked successfully",
        { iccid },
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to revoke eSIM";
      logger.error("[eSIM] Error revoking eSIM:", error);
      return sendError(
        res,
        "Failed to revoke eSIM",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/:esimTranNo/topup",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { esimTranNo } = req.params;
      const { packageCode, iccid, amount } = req.body;

      if (!esimTranNo || !packageCode) {
        return sendError(
          res,
          "esimTranNo and packageCode are required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      const result = await esimAccessService.topupESIMWithTransactionId({
        esimTranNo,
        iccid,
        packageCode,
        amount,
      });

      return sendSuccess(
        res,
        "eSIM topped up successfully",
        result,
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to topup eSIM";
      logger.error("[eSIM] Error topping up eSIM:", error);
      return sendError(
        res,
        "Failed to topup eSIM",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.get(
  "/:esimTranNo/usage",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { esimTranNo } = req.params;

      if (!esimTranNo) {
        return sendError(
          res,
          "eSIM transaction number is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      const usage = await esimAccessService.checkESIMUsage(esimTranNo);

      return sendSuccess(
        res,
        "Usage fetched successfully",
        usage,
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch usage";
      logger.error("[eSIM] Error fetching usage:", error);
      return sendError(
        res,
        "Failed to fetch usage",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/:esimTranNo/sms",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { esimTranNo } = req.params;
      const { message } = req.body;

      if (!esimTranNo || !message) {
        return sendError(
          res,
          "Missing required fields",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      await esimAccessService.sendSMSToESIM(esimTranNo, message);

      return sendSuccess(
        res,
        "SMS sent successfully",
        { esimTranNo },
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to send SMS";
      logger.error("[eSIM] Error sending SMS:", error);
      return sendError(
        res,
        "Failed to send SMS",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.post(
  "/webhook/set",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        return sendError(
          res,
          "Webhook URL is required",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }

      const result = await esimAccessService.setWebhook(webhookUrl);

      if (result) {
        return sendSuccess(
          res,
          "Webhook set successfully",
          { webhookUrl },
          statusCode.OK,
        );
      } else {
        return sendError(
          res,
          "Failed to set webhook",
          undefined,
          statusCode.BAD_REQUEST,
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to set webhook";
      logger.error("[eSIM] Error setting webhook:", error);
      return sendError(
        res,
        "Failed to set webhook",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.get(
  "/webhook/get",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const webhookUrl = await esimAccessService.getWebhookUrl();

      return sendSuccess(
        res,
        "Webhook retrieved successfully",
        { webhookUrl },
        statusCode.OK,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to get webhook";
      logger.error("[eSIM] Error getting webhook:", error);
      return sendError(
        res,
        "Failed to get webhook",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
);
router.get(
  "/my-esims",
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

      const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
      const page = parseInt(req.query.page as string) || 1;

      const result = await esimService.getUserMyESIMs(userId, page, limit);

      return sendSuccess(res, "User eSIMs fetched successfully", {
        orders: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch eSIMs";
      logger.error("[eSIMs] Error fetching user eSIMs:", error);
      return sendError(
        res,
        "Failed to fetch eSIMs",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);

export default router;
