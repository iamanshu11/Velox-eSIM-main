import { Request, Response } from 'express';
import { stripeService } from '@modules/payments/stripe.service';
import { walletService } from '@modules/wallet/wallet.service';
import { orderService } from '@modules/order/order.service';
import { invoiceService } from '@modules/payments/invoice.service';
import db from '@config/database';
import emailService from '@utils/email';
import { secrets } from '@config/env';
import logger from '@utils/logger';
import statusCode from 'http-status-codes';
import { sendError, sendSuccess } from '@utils/response';


export const handleStripeWebhook = async (
  req: Request,
  res: Response
) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const body = req.body;

    if (!signature || !body) {
      logger.error('[StripeWebhook] Missing signature or body');
      return sendError(
        res,
        'Missing webhook signature',
        '',
        statusCode.BAD_REQUEST
      );
    }

    if (!secrets.stripe_webhook_secret) {
      logger.error('[StripeWebhook] STRIPE_WEBHOOK_SECRET not configured');
      return sendError(
        res,
        'Webhook configuration error',
        '',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }

    let event;
    try {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      event = stripeService.verifyWebhookSignature(
        bodyString,
        signature,
        secrets.stripe_webhook_secret
      );
    } catch (error) {
      logger.error(
        '[StripeWebhook] Signature verification failed',
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        'Webhook signature verification failed',
        '',
        statusCode.UNAUTHORIZED
      );
    }

    logger.info(`[StripeWebhook] Processing event: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      if (!event.data?.object) {
        logger.error('[StripeWebhook] Missing event.data.object');
        return sendError(
          res,
          'Invalid webhook data',
          '',
          statusCode.BAD_REQUEST
        );
      }
      interface PaymentIntentObject {
        id?: string;
        metadata?: Record<string, string>;
        amount_received?: number;
      }
      const paymentIntent = event.data.object as PaymentIntentObject;
      const { id: paymentIntentId, metadata, amount_received } = paymentIntent;
      const { userId, type = 'WALLET_TOP_UP', packageCode, quantity } = metadata || {};

      if (!userId) {
        logger.error('[StripeWebhook] Missing userId in metadata');
        return sendError(
          res,
          'Invalid webhook data',
          '',
          statusCode.BAD_REQUEST
        );
      }

      try {
        const amount = (amount_received || 0) / 100;

        await db.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: 'completed' },
        });

        logger.info(`[StripeWebhook] Payment marked as completed: ${paymentIntentId}`);

        if (type === 'ESIM_PURCHASE') {
          return await handleESIMPurchaseSuccess(
            res,
            userId,
            packageCode || 'unknown',
            parseInt(quantity || '1'),
            amount,
            paymentIntentId || 'unknown'
          );
        } else if (type === 'WALLET_TOP_UP') {
          return await handleWalletTopUpSuccess(res, userId, amount, paymentIntentId || 'unknown');
        } else {
          logger.warn(`[StripeWebhook] Unknown payment type: ${type}`);
          return sendSuccess(res, 'Webhook processed successfully', {
            event: event.type,
            userId,
            type,
          });
        }
      } catch (error) {
        logger.error(
          '[StripeWebhook] Error processing payment success',
          error instanceof Error ? error : new Error(String(error))
        );

        return sendSuccess(res, 'Webhook received (processing error)', {
          event: event.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      if (!event.data?.object) {
        logger.error('[StripeWebhook] Missing event.data.object');
        return sendError(
          res,
          'Invalid webhook data',
          '',
          statusCode.BAD_REQUEST
        );
      }
      interface FailedPaymentIntent {
        metadata?: Record<string, string>;
        last_payment_error?: { message?: string };
      }
      const paymentIntent = event.data.object as FailedPaymentIntent;
      const { metadata, last_payment_error } = paymentIntent;
      const { userId } = metadata || {};

      logger.warn(
        `[StripeWebhook] Payment failed for user ${userId}: ${last_payment_error?.message}`
      );

      return sendSuccess(res, 'Webhook processed successfully', {
        event: event.type,
        userId,
        error: last_payment_error?.message,
      });
    }

    logger.info(`[StripeWebhook] Unhandled event type: ${event.type}`);
    return sendSuccess(res, 'Webhook received', { event: event.type });
  } catch (error) {
    logger.error(
      '[StripeWebhook] Error handling webhook',
      error instanceof Error ? error : new Error(String(error))
    );

    return sendError(
      res,
      'Webhook processing failed',
      error instanceof Error ? error.message : 'Unknown error',
      statusCode.INTERNAL_SERVER_ERROR
    );
  }
};
async function handleESIMPurchaseSuccess(
  res: Response,
  userId: string,
  packageCode: string,
  quantity: number,
  amount: number,
  paymentIntentId: string
) {
  try {
    logger.info(
      `[StripeWebhook] Processing eSIM purchase: User ${userId}, Package ${packageCode}, Qty ${quantity}`
    );

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const order = await orderService.createOrder(
      userId,
      packageCode,
      quantity,
      amount,
      paymentIntentId
    );

    logger.info(`[StripeWebhook] Order created: ${order.id}`);

    const metadata = order.metadata as Record<string, unknown> | null;
    const esimCode = (metadata?.esimActivationCode as string) || 'CODE-NOT-GENERATED';

    try {
      const payment = await db.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      const activationCode = (order.metadata as Record<string, unknown> | null)?.esimActivationCode as string | undefined;
      const invoice = await invoiceService.createInvoice({
        userId,
        paymentId: payment?.id,
        orderId: order.id,
        amount,
        description: `eSIM Purchase - ${packageCode} x${quantity}`,
        metadata: {
          packageCode,
          quantity,
          orderNo: order.orderNo,
          paymentIntentId,
          activationCode,
        },
      });

      await emailService.sendInvoiceEmail(
        user.email,
        invoice.invoiceNumber,
        invoice.amount,
        invoice.description,
        invoice.issuedAt,
        order.orderNo,
        activationCode,
      );

      logger.info(
        `[StripeWebhook] Invoice email sent to ${user.email} for invoice ${invoice.invoiceNumber}`
      );
    } catch (invoiceError) {
      logger.error(
        '[StripeWebhook] Error creating or sending invoice',
        invoiceError instanceof Error ? invoiceError : new Error(String(invoiceError))
      );
    }

    return sendSuccess(res, 'eSIM purchase processed successfully', {
      event: 'payment_intent.succeeded',
      userId,
      orderId: order.id,
      packageCode,
      esimCode,
      amount,
    });
  } catch (error) {
    logger.error(
      '[StripeWebhook] Error processing eSIM purchase',
      error instanceof Error ? error : new Error(String(error))
    );

    return sendSuccess(res, 'Webhook received (eSIM processing error)', {
      event: 'payment_intent.succeeded',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
async function handleWalletTopUpSuccess(
  res: Response,
  userId: string,
  amount: number,
  paymentIntentId: string
) {
  try {
    logger.info(
      `[StripeWebhook] Processing wallet top-up: User ${userId}, Amount: $${amount}`
    );

    const updatedWallet = await walletService.addFunds(
      userId,
      amount,
      paymentIntentId,
      paymentIntentId
    );

    logger.info(
      `[StripeWebhook] Wallet updated for user ${userId}, New balance: $${updatedWallet.balance}`
    );

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user) {
        try {
          const payment = await db.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId, userId },
          });

          if (payment) {
            let invoiceCreated = false;
            try {
              const invoice = await invoiceService.createInvoice({
                userId,
                paymentId: payment.id,
                amount,
                description: 'Wallet top-up',
                metadata: {
                  paymentIntentId,
                },
              });

              invoiceCreated = true;
              await emailService.sendInvoiceEmail(
                user.email,
                invoice.invoiceNumber,
                invoice.amount,
                invoice.description,
                invoice.issuedAt,
              );
            } finally {
              if (!invoiceCreated) {
                await emailService.sendPaymentReceipt(user.email, amount);
              }
            }
          }
        } catch (invoiceError) {
          logger.error(
            '[StripeWebhook] Error creating or sending invoice',
            invoiceError instanceof Error ? invoiceError : new Error(String(invoiceError))
          );
        }

        await emailService.sendPaymentReceipt(user.email, amount);
      }
    } catch (emailError) {
      logger.error(
        '[StripeWebhook] Error sending payment receipt email',
        emailError instanceof Error ? emailError : new Error(String(emailError))
      );
    }

    return sendSuccess(res, 'Wallet top-up processed successfully', {
      event: 'payment_intent.succeeded',
      userId,
      amount,
      newBalance: updatedWallet.balance,
    });
  } catch (error) {
    logger.error(
      '[StripeWebhook] Error processing wallet top-up',
      error instanceof Error ? error : new Error(String(error))
    );

    return sendSuccess(res, 'Webhook received (wallet top-up error)', {
      event: 'payment_intent.succeeded',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default handleStripeWebhook;
