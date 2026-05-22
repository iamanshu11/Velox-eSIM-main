import db from "@config/database";
import { authenticate } from "@middleware/auth";
import { asyncHandler } from "@utils/errors";
import logger from "@utils/logger";
import { sendError, sendSuccess } from "@utils/response";
import { Request, Response, Router } from "express";
import statusCode from "http-status-codes";
import { StripeService } from "./stripe.service";
import { invoiceService } from "./invoice.service";
import billingRoutes from "./billing.routes";
import invoiceRoutes from "./invoice.routes";
import emailService from "@utils/email";

const router = Router();
const stripeService = new StripeService();

router.use("/invoices", invoiceRoutes);

router.use("/billing", billingRoutes);
router.post(
  "/topup/intent",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        "Unauthorized",
        "User ID not found in token",
        statusCode.UNAUTHORIZED
      );
    }

    if (!amount || amount <= 0) {
      return sendError(
        res,
        "Invalid amount",
        "Amount must be greater than 0",
        statusCode.BAD_REQUEST
      );
    }

    if (amount < 2 || amount > 3000) {
      return sendError(
        res,
        "Invalid amount",
        "Amount must be between $2 and $3,000",
        statusCode.BAD_REQUEST
      );
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return sendError(
          res,
          "User not found",
          "User profile not found",
          statusCode.NOT_FOUND
        );
      }

      const result = await stripeService.createTopUpPaymentIntent(
        userId,
        amount,
        user.email
      );

      await db.payment.create({
        data: {
          userId,
          stripePaymentIntentId: result.paymentIntentId,
          amount,
          currency: "USD",
          status: "pending",
          metadata: { type: "WALLET_TOP_UP" },
        },
      });

      logger.info(
        `[Payments] Payment intent created for user ${userId}: ${result.paymentIntentId}`
      );

      return sendSuccess(
        res,
        "Payment intent created successfully",
        {
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
          amount: result.amount,
        },
        statusCode.CREATED
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create payment intent";
      logger.error(
        "[Payments] Error creating payment intent",
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        "Failed to create payment intent",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.post(
  "/topup/confirm",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        "Unauthorized",
        "User ID not found in token",
        statusCode.UNAUTHORIZED
      );
    }

    if (!paymentIntentId) {
      return sendError(
        res,
        "Missing payment intent ID",
        "paymentIntentId is required",
        statusCode.BAD_REQUEST
      );
    }

    try {
      const payment = await db.payment.findFirst({
        where: {
          stripePaymentIntentId: paymentIntentId,
          userId,
        },
      });

      if (!payment) {
        return sendError(
          res,
          "Payment not found",
          "Payment record not found in database",
          statusCode.NOT_FOUND
        );
      }

      const stripePayment = await stripeService.getPaymentIntent(paymentIntentId);

      if ((stripePayment as Record<string, unknown>).status !== "succeeded") {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: ((stripePayment as Record<string, unknown>).status as string),
            errorMessage: `Payment status: ${(stripePayment as Record<string, unknown>).status}`,
          },
        });

        return sendError(
          res,
          "Payment not completed",
          `Payment status is ${(stripePayment as Record<string, unknown>).status}, expected succeeded`,
          statusCode.BAD_REQUEST
        );
      }

      await db.payment.update({
        where: { id: payment.id },
        data: { status: "succeeded" },
      });

      try {
        const stripePayment = await stripeService.getPaymentIntent(paymentIntentId);
        const metadata = (stripePayment.metadata || {}) as Record<string, string>;
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (user?.email) {
          const existingInvoice = await invoiceService.getInvoiceByPaymentId(userId, payment.id);
          if (!existingInvoice) {
            const invoice = await invoiceService.createInvoice({
              userId,
              paymentId: payment.id,
              amount: payment.amount,
              description: metadata.type === 'ESIM_PURCHASE'
                ? `eSIM Purchase - ${metadata.packageCode || 'unknown'} x${metadata.quantity || '1'}`
                : 'Wallet top-up',
              metadata: {
                ...metadata,
                stripePaymentIntentId: paymentIntentId,
              },
            });

            await emailService.sendInvoiceEmail(
              user.email,
              invoice.invoiceNumber,
              invoice.amount,
              invoice.description,
              invoice.issuedAt,
            );

            logger.info('[Payments] Payment invoice created and emailed', {
              paymentId: payment.id,
              invoiceId: invoice.id,
            });
          }
        }
      } catch (invoiceError) {
        logger.error('[Payments] Error creating invoice on payment complete', invoiceError instanceof Error ? invoiceError : new Error(String(invoiceError)));
      }

      let wallet = await db.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await db.wallet.create({
          data: {
            userId,
            balance: 0,
            currency: "USD",
          },
        });
      }

      const previousBalance = wallet.balance;
      const newBalance = previousBalance + payment.amount;

      const updatedWallet = await db.wallet.update({
        where: { userId },
        data: {
          balance: newBalance,
        },
      });

      await db.transaction.create({
        data: {
          userId,
          transactionType: "TOP_UP",
          amount: payment.amount,
          balanceBefore: previousBalance,
          balanceAfter: newBalance,
          status: "completed",
          reference: paymentIntentId,
          metadata: {
            stripePaymentId: paymentIntentId,
            paymentId: payment.id,
          },
        },
      });

      try {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (user?.email) {
          const existingInvoice = await invoiceService.getInvoiceByPaymentId(userId, payment.id);
          if (!existingInvoice) {
            const invoice = await invoiceService.createInvoice({
              userId,
              paymentId: payment.id,
              amount: payment.amount,
              description: 'Wallet top-up',
              metadata: {
                type: 'WALLET_TOP_UP',
                paymentIntentId,
                paymentId: payment.id,
              },
            });

            await emailService.sendInvoiceEmail(
              user.email,
              invoice.invoiceNumber,
              invoice.amount,
              invoice.description,
              invoice.issuedAt,
            );

            logger.info('[Payments] Wallet top-up invoice created and emailed', {
              paymentId: payment.id,
              invoiceId: invoice.id,
            });
          }
        }
      } catch (invoiceError) {
        logger.error('[Payments] Error creating or emailing wallet top-up invoice', invoiceError instanceof Error ? invoiceError : new Error(String(invoiceError)));
      }

      logger.info(
        `[Payments] Top-up confirmed for user ${userId}: $${payment.amount}, new balance: $${newBalance}`
      );

      return sendSuccess(
        res,
        "Top-up completed successfully",
        {
          status: "success",
          amount: payment.amount,
          walletBalance: updatedWallet.balance,
          transactionId: paymentIntentId,
        },
        statusCode.OK
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to confirm payment";
      logger.error(
        "[Payments] Error confirming payment",
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        "Failed to confirm payment",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.get(
  "/user/my-payments",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    if (!userId) {
      return sendError(
        res,
        "Unauthorized",
        "User ID not found in token",
        statusCode.UNAUTHORIZED
      );
    }

    try {
      const [payments, total] = await Promise.all([
        db.payment.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          select: {
            id: true,
            stripePaymentIntentId: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                issuedAt: true,
              },
            },
          },
        }),
        db.payment.count({ where: { userId } }),
      ]);

      return sendSuccess(
        res,
        "User payments fetched successfully",
        {
          payments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        statusCode.OK
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch payments";
      logger.error(
        "[Payments] Error fetching user payments",
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        "Failed to fetch payments",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.post(
  "/:paymentIntentId/complete",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found in token", statusCode.UNAUTHORIZED);
    }

    try {
      const stripePayment = await stripeService.getPaymentIntent(paymentIntentId);

      if ((stripePayment as Record<string, unknown>).status !== "succeeded") {
        return sendError(
          res,
          "Payment not completed",
          `Payment status is ${(stripePayment as Record<string, unknown>).status}`,
          statusCode.BAD_REQUEST
        );
      }

      const payment = await db.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId, userId },
      });

      if (payment && payment.status !== "succeeded") {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "succeeded" },
        });
      }

      logger.info(`[Payments] Payment completed: ${paymentIntentId}`);

      return sendSuccess(res, "Payment completed successfully", {
        paymentIntentId,
        status: "succeeded",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to complete payment";
      logger.error("[Payments] Error completing payment", error instanceof Error ? error : new Error(String(error)));
      return sendError(res, "Failed to complete payment", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.post(
  "/:paymentIntentId/refund",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found in token", statusCode.UNAUTHORIZED);
    }

    try {
      const payment = await db.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId, userId },
      });

      if (!payment) {
        return sendError(res, "Payment not found", "Payment record not found", statusCode.NOT_FOUND);
      }

      if (payment.status !== "succeeded") {
        return sendError(res, "Cannot refund", "Only succeeded payments can be refunded", statusCode.BAD_REQUEST);
      }

      await db.payment.update({
        where: { id: payment.id },
        data: { status: "refunded" },
      });

      const wallet = await db.wallet.findUnique({ where: { userId } });
      if (wallet && wallet.balance >= payment.amount) {
        const newBalance = wallet.balance - payment.amount;
        await db.wallet.update({ where: { userId }, data: { balance: newBalance } });
        await db.transaction.create({
          data: {
            userId,
            transactionType: "REFUND",
            amount: payment.amount,
            balanceBefore: wallet.balance,
            balanceAfter: newBalance,
            status: "completed",
            reference: paymentIntentId,
            metadata: { type: "STRIPE_REFUND", paymentId: payment.id },
          },
        });
      }

      logger.info(`[Payments] Payment refunded: ${paymentIntentId} for user ${userId}`);

      return sendSuccess(res, "Payment refunded successfully", {
        paymentIntentId,
        amount: payment.amount,
        status: "refunded",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to refund payment";
      logger.error("[Payments] Error refunding payment", error instanceof Error ? error : new Error(String(error)));
      return sendError(res, "Failed to refund payment", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.get(
  "/:paymentIntentId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        "Unauthorized",
        "User ID not found in token",
        statusCode.UNAUTHORIZED
      );
    }

    try {
      const payment = await db.payment.findFirst({
        where: {
          stripePaymentIntentId: paymentIntentId,
          userId,
        },
      });

      if (!payment) {
        return sendError(
          res,
          "Payment not found",
          "Payment record not found",
          statusCode.NOT_FOUND
        );
      }

      return sendSuccess(
        res,
        "Payment fetched successfully",
        payment,
        statusCode.OK
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch payment";
      logger.error(
        "[Payments] Error fetching payment",
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        "Failed to fetch payment",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.post(
  "/purchase/intent",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, packageCode, quantity } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        "Unauthorized",
        "User ID not found in token",
        statusCode.UNAUTHORIZED
      );
    }

    if (!amount || amount <= 0) {
      return sendError(
        res,
        "Invalid amount",
        "Amount must be greater than 0",
        statusCode.BAD_REQUEST
      );
    }

    if (!packageCode) {
      return sendError(
        res,
        "Invalid package",
        "packageCode is required",
        statusCode.BAD_REQUEST
      );
    }

    if (!quantity || quantity < 1) {
      return sendError(
        res,
        "Invalid quantity",
        "quantity must be at least 1",
        statusCode.BAD_REQUEST
      );
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return sendError(
          res,
          "User not found",
          "User profile not found",
          statusCode.NOT_FOUND
        );
      }

      const result = await stripeService.createPurchasePaymentIntent(
        userId,
        amount,
        user.email,
        {
          packageCode,
          quantity,
        }
      );

      await db.payment.create({
        data: {
          userId,
          stripePaymentIntentId: result.paymentIntentId,
          amount,
          currency: "USD",
          status: "pending",
          metadata: {
            type: "ESIM_PURCHASE",
            packageCode,
            quantity: quantity.toString(),
          },
        },
      });

      logger.info(
        `[Payments] Purchase payment intent created for user ${userId}: ${result.paymentIntentId}`
      );

      return sendSuccess(
        res,
        "Payment intent created successfully",
        {
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
          amount: result.amount,
        },
        statusCode.CREATED
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create payment intent";
      logger.error(
        "[Payments] Error creating purchase payment intent",
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        "Failed to create payment intent",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);

export default router;

