import db from "@config/database";
import { authenticate, authorize } from "@middleware/auth";
import { esimService, getAllDataPackages, placeOrder, DataPackage } from "@modules/esim/esim.service";
import { settingsService } from "@modules/settings/settings.service";
import { walletService } from "@modules/wallet/wallet.service";
import { asyncHandler } from "@utils/errors";
import { invoiceService } from "@modules/payments/invoice.service";
import emailService from "@utils/email";
import logger from "@utils/logger";
import { sendError, sendSuccess } from "@utils/response";
import { Request, Response, Router } from "express";
import statusCode from "http-status-codes";
import autoRenewalRoutes from "./auto-renewal.routes";
import {
  getActiveESIMs,
  getExpiringESIMs,
  getUserDashboardAnalytics,
  getUserOrders,
  refreshActiveESIMsData,
} from "./order.controller";

const router = Router();

router.use(autoRenewalRoutes);
router.post(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const userId = req.user?.userId;
      const { packageCode, quantity, paymentMethod } = req.body;

      if (!userId) {
        return sendError(
          res,
          "Unauthorized",
          "User not authenticated",
          statusCode.UNAUTHORIZED
        );
      }

      if (!packageCode || !quantity || !paymentMethod) {
        return sendError(
          res,
          "Missing required fields",
          "packageCode, quantity, and paymentMethod are required",
          statusCode.BAD_REQUEST
        );
      }

      if (quantity < 1 || quantity > 100) {
        return sendError(
          res,
          "Invalid quantity",
          "Quantity must be between 1 and 100",
          statusCode.BAD_REQUEST
        );
      }

      if (!['wallet', 'card'].includes(paymentMethod)) {
        return sendError(
          res,
          "Invalid payment method",
          "Payment method must be 'wallet' or 'card'",
          statusCode.BAD_REQUEST
        );
      }

      logger.info('[OrderRoutes] Order creation started', {
        userId,
        packageCode,
        quantity,
        paymentMethod,
      });

      logger.info('[OrderRoutes] Fetching package details', { packageCode });
      let selectedPackage: DataPackage | null = null;
      
      try {
        const packageResult = await getAllDataPackages({ packageCode }, 1, 50);
        selectedPackage = packageResult[0];
      } catch (packageError) {
        logger.warn('[OrderRoutes] Error fetching specific package, using default pricing', {
          packageCode,
          error: packageError instanceof Error ? packageError.message : String(packageError),
        });
      }

      if (!selectedPackage?.packageCode) {
        return sendError(
          res,
          "Package validation failed",
          `Unable to validate package code ${packageCode}`,
          statusCode.BAD_REQUEST
        );
      }

      const settings = await settingsService.getSettings();
      if (!settings || !settings.profitMargin) {
        return sendError(
          res,
          "Service configuration error",
          "Profit margin not configured",
          statusCode.INTERNAL_SERVER_ERROR
        );
      }
      const wholesalePriceInCents = Math.round((selectedPackage.price as number) / 100);
      const retailPriceInCents = Math.round(wholesalePriceInCents * settings.profitMargin);
      const retailPriceUSD = retailPriceInCents / 100;
      const totalPriceUSD = retailPriceUSD * quantity;

      const packageFetchTime = Date.now() - startTime;
      logger.info('[OrderRoutes] Order pricing calculation', {
        packageCode,
        quantity,
        rawPriceFromAPI: selectedPackage.price,
        wholesalePriceInCents,
        profitMargin: settings.profitMargin,
        retailPriceInCents,
        retailPriceUSD,
        totalPriceUSD,
        packageFetchTimeMs: packageFetchTime,
      });

      if (paymentMethod === 'wallet') {
        const userWallet = await walletService.getWallet(userId);
        if (userWallet.balance < totalPriceUSD) {
          return sendError(
            res,
            "Insufficient wallet balance",
            `Your wallet balance ($${userWallet.balance.toFixed(2)}) is less than the order total ($${totalPriceUSD.toFixed(2)})`,
            statusCode.PAYMENT_REQUIRED
          );
        }

        await walletService.deductFunds(
          userId,
          totalPriceUSD,
          packageCode,
          { quantity, paymentMethod, packageCode }
        );
        
        logger.info('[OrderRoutes] Wallet deducted', {
          userId,
          amount: totalPriceUSD,
          remainingBalance: userWallet.balance - totalPriceUSD,
        });
      } else if (paymentMethod === 'card') {
        logger.info('[OrderRoutes] Card payment order initiated', {
          userId,
          totalPrice: totalPriceUSD,
        });
      }

      const orderNo = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const balanceBefore = paymentMethod === 'wallet' 
        ? (await walletService.getWallet(userId)).balance + totalPriceUSD
        : 0;
      
      const transaction = await db.transaction.create({
        data: {
          userId,
          transactionType: 'ESIM_PURCHASE',
          amount: totalPriceUSD,
          balanceBefore,
          balanceAfter: paymentMethod === 'wallet' ? balanceBefore - totalPriceUSD : 0,
          status: 'completed',
          reference: orderNo,
          metadata: {
            packageCode,
            quantity,
            paymentMethod,
            unitPrice: retailPriceUSD,
          },
        },
      });

      let paymentRecord = null;
      if (paymentMethod === 'wallet') {
        paymentRecord = await db.payment.create({
          data: {
            userId,
            stripePaymentIntentId: `WALLET-${transaction.id}`,
            amount: totalPriceUSD,
            currency: 'USD',
            status: 'succeeded',
            metadata: {
              type: 'ESIM_PURCHASE',
              paymentMethod,
              packageCode,
              quantity,
              transactionId: transaction.id,
            },
          },
        });

        logger.info('[OrderRoutes] Wallet purchase payment record created', {
          userId,
          paymentId: paymentRecord.id,
          amount: totalPriceUSD,
        });
      }

      const order = await db.order.create({
        data: {
          orderNo,
          userId,
          transactionId: transaction.id,
          totalAmount: transaction.amount,
          currency: 'USD',
          paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'unpaid',
          status: 'processing',
          metadata: {
            packageCode,
            quantity,
            paymentMethod,
            unitPrice: retailPriceUSD,
            externalOrderNo: null,
          },
        },
      });

      const totalTimeBeforeResponse = Date.now() - startTime;
      logger.info('[OrderRoutes] Order created in database', {
        orderId: order.id,
        orderNo: order.orderNo,
        transactionId: transaction.id,
        status: order.status,
        totalTimeMs: totalTimeBeforeResponse,
      });

      const response = sendSuccess(
        res,
        "Order created successfully",
        {
          id: order.id,
          orderNo: order.orderNo,
          totalAmount: transaction.amount,
          paymentStatus: order.paymentStatus,
          status: order.status,
          createdAt: order.createdAt,
          metadata: order.metadata,
        },
        statusCode.CREATED
      );

      (async () => {
        try {
          const externalCallStart = Date.now();
          
          const totalRawUnitsFromAPI = Math.round(selectedPackage.price) * quantity;
          
          const payloadToSend = {
            packageInfoList: [
              {
                packageCode,
                count: quantity,
                price: Math.round(selectedPackage.price),
              },
            ],
            amount: totalRawUnitsFromAPI,
          };
          
          logger.warn('[OrderRoutes] ⚠️ SENDING TO eSIMACCESS - CHECK THIS LOG', {
            orderId: order.id,
            packageCode,
            quantity,
            rawPackagePriceFromAPI: selectedPackage.price,
            perUnitPriceSending: Math.round(selectedPackage.price),
            totalAmountSending: totalRawUnitsFromAPI,
            convertedToCents: Math.round(totalRawUnitsFromAPI / 100),
            exactPayload: JSON.stringify(payloadToSend),
          });

          const externalOrderResponse = await placeOrder(payloadToSend);

          const externalCallTime = Date.now() - externalCallStart;
          
          await db.order.update({
            where: { id: order.id },
            data: {
              status: 'completed',
              paymentStatus: 'paid',
              metadata: {
                ...(typeof order.metadata === 'object' && order.metadata ? order.metadata : {}),
                externalOrderNo: externalOrderResponse.orderNo,
                transactionId: externalOrderResponse.transactionId,
              },
            },
          });

          logger.info('[OrderRoutes] ✅ SUCCESS: External eSIM order created', {
            orderId: order.id,
            externalOrderNo: externalOrderResponse.orderNo,
            transactionId: externalOrderResponse.transactionId,
            externalCallTimeMs: externalCallTime,
          });

          let invoiceRecord = null;
          try {
            const activationCode = (order.metadata as Record<string, unknown> | null)?.esimActivationCode as string | undefined;
            invoiceRecord = await invoiceService.createInvoice({
              userId,
              paymentId: paymentRecord?.id,
              orderId: order.id,
              amount: totalPriceUSD,
              description: `eSIM Purchase - ${packageCode} x${quantity}`,
              metadata: {
                packageCode,
                quantity,
                paymentMethod,
                externalOrderNo: externalOrderResponse.orderNo,
                transactionId: externalOrderResponse.transactionId,
                activationCode,
              },
            });

            logger.info('[OrderRoutes] Invoice created for order', {
              orderId: order.id,
              invoiceId: invoiceRecord.id,
              invoiceNumber: invoiceRecord.invoiceNumber,
            });
          } catch (invoiceError) {
            logger.error('[OrderRoutes] Error creating invoice for order', {
              orderId: order.id,
              error: invoiceError instanceof Error ? invoiceError.message : String(invoiceError),
            });
          }
          try {
            const user = await db.user.findUnique({
              where: { id: userId },
              select: { email: true, name: true },
            });

            if (user?.email) {
              logger.info('[OrderRoutes] Sending order confirmation email', {
                orderId: order.id,
                userEmail: user.email,
                amount: totalPriceUSD,
              });

              const activationCode = (order.metadata as Record<string, unknown> | null)?.esimActivationCode as string | undefined;

              if (invoiceRecord) {
                await emailService.sendInvoiceEmail(
                  user.email,
                  invoiceRecord.invoiceNumber,
                  invoiceRecord.amount,
                  invoiceRecord.description,
                  invoiceRecord.issuedAt,
                  order.orderNo,
                  activationCode,
                );
              } else {
                await emailService.sendOrderConfirmation(
                  user.email,
                  order.id,
                  totalPriceUSD,
                  'completed',
                );
              }

              logger.info('[OrderRoutes] ✅ Order confirmation email sent successfully', {
                orderId: order.id,
                userEmail: user.email,
              });
            } else {
              logger.warn('[OrderRoutes] Could not send order email - user email not found', {
                orderId: order.id,
                userId,
              });
            }
          } catch (emailErr) {
            logger.error('[OrderRoutes] Failed to send order confirmation email', {
              orderId: order.id,
              emailError: emailErr instanceof Error ? emailErr.message : String(emailErr),
            });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const errorObj = err instanceof Error ? err : new Error(String(err));
          
          logger.error('[OrderRoutes] ❌ FAILED: External eSIM order creation error', {
            orderId: order.id,
            errorMessage: errorMsg,
            errorCode: (err as any)?.code || (err as any)?.response?.status,
            errorData: (err as any)?.response?.data,
            fullError: errorObj,
          });

          await db.order.update({
            where: { id: order.id },
            data: {
              status: 'failed',
              metadata: {
                ...(typeof order.metadata === 'object' && order.metadata ? order.metadata : {}),
                externalError: errorMsg,
                errorDetails: JSON.stringify((err as any)?.response?.data || {}),
              },
            },
          }).catch(updateErr => {
            logger.error('[OrderRoutes] Failed to update order with error status', {
              orderId: order.id,
              updateError: updateErr instanceof Error ? updateErr.message : String(updateErr),
            });
          });

          if (paymentMethod === 'wallet') {
            try {
              logger.warn('[OrderRoutes] ⚠️ AUTO-REFUNDING: External API failed, initiating refund', {
                orderId: order.id,
                transactionId: transaction.id,
                userId,
                amountToRefund: totalPriceUSD,
              });

              await walletService.refund(
                userId,
                totalPriceUSD,
                order.id,
                `Auto-refund: eSIMaccess API failed. Error: ${errorMsg}`
              );
              await db.transaction.create({
                data: {
                  userId,
                  orderId: order.id,
                  transactionType: 'REFUND',
                  amount: totalPriceUSD,
                  balanceBefore: (await walletService.getWallet(userId)).balance - totalPriceUSD,
                  balanceAfter: (await walletService.getWallet(userId)).balance,
                  status: 'completed',
                  reference: order.id,
                  metadata: {
                    reason: 'Auto-refund: eSIMaccess API failed',
                    originalError: errorMsg,
                    originalTransactionId: transaction.id,
                  },
                },
              });

              logger.info('[OrderRoutes] ✅ AUTO-REFUND SUCCESSFUL', {
                orderId: order.id,
                transactionId: transaction.id,
                userId,
                refundAmount: totalPriceUSD,
                originalError: errorMsg,
              });

              await db.order.update({
                where: { id: order.id },
                data: {
                  paymentStatus: 'refunded',
                  metadata: {
                    ...(typeof order.metadata === 'object' && order.metadata ? order.metadata : {}),
                    refundStatus: 'completed',
                    refundAmount: totalPriceUSD,
                    refundReason: errorMsg,
                    refundTimestamp: new Date().toISOString(),
                  },
                },
              }).catch(updateErr => {
                logger.error('[OrderRoutes] Failed to update order with refund status', {
                  orderId: order.id,
                  updateError: updateErr instanceof Error ? updateErr.message : String(updateErr),
                });
              });
            } catch (refundErr) {
              logger.error('[OrderRoutes] ❌ CRITICAL: AUTO-REFUND FAILED', {
                orderId: order.id,
                transactionId: transaction.id,
                userId,
                refundAmount: totalPriceUSD,
                refundError: refundErr instanceof Error ? refundErr.message : String(refundErr),
                originalApiError: errorMsg,
                severity: 'CRITICAL - MANUAL INTERVENTION REQUIRED',
              });

              await db.order.update({
                where: { id: order.id },
                data: {
                  paymentStatus: 'pending_refund', 
                  metadata: {
                    ...(typeof order.metadata === 'object' && order.metadata ? order.metadata : {}),
                    refundStatus: 'failed',
                    refundAmount: totalPriceUSD,
                    refundError: refundErr instanceof Error ? refundErr.message : String(refundErr),
                    manualRefundRequired: true,
                  },
                },
              }).catch(updateErr => {
                logger.error('[OrderRoutes] Failed to update order with failed refund status', {
                  orderId: order.id,
                  updateError: updateErr instanceof Error ? updateErr.message : String(updateErr),
                });
              });
            }
          } else if (paymentMethod === 'card') {
            logger.warn('[OrderRoutes] Card payment order failed (Stripe refund needed)', {
              orderId: order.id,
              transactionId: transaction.id,
              userId,
              amount: totalPriceUSD,
              note: 'Stripe refund must be handled separately via Stripe webhook',
            });
          }
        }
      })();

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create order";
      logger.error("[OrderRoutes] Error creating order", error instanceof Error ? error : new Error(String(error)));
      return sendError(
        res,
        "Failed to create order",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const pageNum = parseInt(req.query.page as string) || 1;

    try {
      const result = await esimService.getOrdersWithPricing(pageNum, limit);

      return sendSuccess(res, "Orders fetched successfully", {
        orders: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch orders";
      console.error("[Orders] Error fetching orders:", error);
      return sendError(
        res,
        "Failed to fetch orders",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/user/my-orders",
  authenticate,
  getUserOrders,
);
router.get("/dashboard/active-esims", authenticate, getActiveESIMs);
router.get("/dashboard/expiring-esims", authenticate, getExpiringESIMs);
router.get("/dashboard/analytics", authenticate, getUserDashboardAnalytics);
router.get("/dashboard/refresh-active", authenticate, refreshActiveESIMsData);
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const order = await esimService.getOrderByOrderNo(id);

      if (!order) {
        return sendError(res, "Order not found", undefined, statusCode.NOT_FOUND);
      }

      return sendSuccess(res, "Order retrieved successfully", order);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch order";
      console.error("[Orders] Error fetching order:", error);
      return sendError(res, "Failed to fetch order", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  }),
);
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  (_req: Request, res: Response) => {
    return sendError(
      res,
      "Order status updates are handled by eSIMaccess webhooks",
      "Manual status updates are not supported",
      statusCode.BAD_REQUEST,
    );
  },
);
router.post(
  "/:id/cancel",
  authenticate,
  authorize("ADMIN"),
  (_req: Request, res: Response) => {
    return sendError(
      res,
      "Order cancellation must be done through eSIMaccess dashboard",
      "Manual cancellation is not supported",
      statusCode.BAD_REQUEST,
    );
  },
);

export default router;
