import Stripe from 'stripe';
import { AppError } from '@utils/errors';
import logger from '@utils/logger';
import { secrets } from '@config/env';
import db from '@config/database';

interface StripeWebhookEvent extends Record<string, unknown> {
  type?: string;
  data?: {
    object?: Record<string, unknown>;
  };
}

interface PaymentIntentMetadata extends Record<string, unknown> {
  userId?: string;
}
if (!secrets.stripe_secret_key) {
  logger.warn('[StripeService] STRIPE_SECRET_KEY is not configured. Payments will fail.');
}

const stripe = new Stripe(secrets.stripe_secret_key || '', {
  apiVersion: '2023-10-16',
});

export class StripeService {
async createTopUpPaymentIntent(
    userId: string,
    amount: number,
    userEmail: string
  ) {
    if (!secrets.stripe_secret_key) {
      throw new AppError(
        500,
        'Payment service is not configured. Please contact support.'
      );
    }

    try {
      if (amount <= 0 || amount < 2) {
        throw new AppError(400, 'Minimum top-up is $2');
      }

      if (amount > 3000) {
        throw new AppError(400, 'Maximum top-up is $3,000');
      }

      const amountInCents = Math.round(amount * 100);

      const idempotencyKey = `topup-${userId}-${amountInCents}-${Math.floor(Date.now() / 60000)}`;

      logger.info(
        `[StripeService] Creating payment intent for user ${userId}, amount: $${amount}`
      );

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            userId,
            type: 'WALLET_TOP_UP',
          },
          receipt_email: userEmail,
          description: `Wallet top-up for user ${userEmail}`,
        },
        {
          idempotencyKey,
        }
      );

      logger.info(
        `[StripeService] Payment intent created: ${paymentIntent.id} for user ${userId}`
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error(
        `[StripeService] Error creating payment intent for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );

      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(400, `Payment error: ${error.message}`);
      }

      throw error;
    }
  }
async createPurchasePaymentIntent(
    userId: string,
    amount: number,
    userEmail: string,
    purchaseData: { packageCode: string; quantity: number }
  ) {
    if (!secrets.stripe_secret_key) {
      throw new AppError(
        500,
        'Payment service is not configured. Please contact support.'
      );
    }

    try {
      if (amount <= 0 || amount < 0.5) {
        throw new AppError(400, 'Minimum purchase amount is $0.50');
      }

      const amountInCents = Math.round(amount * 100);

      const idempotencyKey = `esim-${userId}-${purchaseData.packageCode}-${amountInCents}-${Math.floor(Date.now() / 60000)}`;

      logger.info(
        `[StripeService] Creating purchase payment intent for user ${userId}, amount: $${amount}, package: ${purchaseData.packageCode}`
      );

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            userId,
            type: 'ESIM_PURCHASE',
            packageCode: purchaseData.packageCode,
            quantity: purchaseData.quantity.toString(),
          },
          receipt_email: userEmail,
          description: `eSIM purchase for user ${userEmail} - ${purchaseData.packageCode} x${purchaseData.quantity}`,
        },
        {
          idempotencyKey,
        }
      );

      logger.info(
        `[StripeService] Purchase payment intent created: ${paymentIntent.id} for user ${userId}`
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error(
        `[StripeService] Error creating purchase payment intent for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );

      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(400, `Payment error: ${error.message}`);
      }

      throw error;
    }
  }
async getPaymentIntent(paymentIntentId: string): Promise<Record<string, unknown>> {
    if (!secrets.stripe_secret_key) {
      throw new AppError(
        500,
        'Payment service is not configured. Please contact support.'
      );
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent as unknown as Record<string, unknown>;
    } catch (error) {
      logger.error(
        `[StripeService] Error retrieving payment intent ${paymentIntentId}`,
        error instanceof Error ? error : new Error(String(error))
      );

      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(400, `Payment error: ${error.message}`);
      }

      throw error;
    }
  }
async confirmPaymentIntent(paymentIntentId: string): Promise<Record<string, unknown>> {
    try {
      const paymentIntent = await this.getPaymentIntent(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new AppError(
          400,
          `Payment not completed. Status: ${paymentIntent.status}`
        );
      }

      return paymentIntent;
    } catch (error) {
      logger.error(
        `[StripeService] Error confirming payment intent ${paymentIntentId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
async handleWebhookEvent(event: StripeWebhookEvent, _signature: string): Promise<Record<string, unknown>> {
    try {
      if (!event || !event.type) {
        throw new AppError(400, 'Invalid webhook event');
      }

      logger.info(`[StripeService] Processing webhook event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          if (event.data?.object) {
            return await this.handlePaymentIntentSucceeded(event.data.object as Record<string, unknown>);
          }
          return { handled: false };

        case 'payment_intent.payment_failed':
          if (event.data?.object) {
            return await this.handlePaymentIntentFailed(event.data.object as Record<string, unknown>);
          }
          return { handled: false };

        case 'payment_intent.canceled':
          if (event.data?.object) {
            return await this.handlePaymentIntentCanceled(event.data.object as Record<string, unknown>);
          }
          return { handled: false };

        default:
          logger.info(`[StripeService] Unhandled event type: ${event.type}`);
          return { handled: false };
      }
    } catch (error) {
      logger.error(
        `[StripeService] Error handling webhook event`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
private async handlePaymentIntentSucceeded(paymentIntent: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const paymentIntentId = paymentIntent.id as string | undefined;
      const metadata = paymentIntent.metadata as PaymentIntentMetadata | undefined;
      const amountReceived = paymentIntent.amount_received as number | undefined;
      const { userId } = metadata || {};

      if (!userId) {
        throw new AppError(400, 'Missing user ID in metadata');
      }

      const amount = amountReceived || 0;
      logger.info(
        `[StripeService] Payment succeeded for user ${userId}, amount: $${amount / 100}`
      );

      const topUpAmount = amount / 100;

      return {
        success: true,
        userId,
        paymentIntentId,
        amount: topUpAmount,
      };
    } catch (error) {
      logger.error(
        `[StripeService] Error handling payment success`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
private async handlePaymentIntentFailed(paymentIntent: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const paymentIntentId = paymentIntent.id as string | undefined;
      const metadata = paymentIntent.metadata as PaymentIntentMetadata | undefined;
      const lastPaymentError = paymentIntent.last_payment_error as { message?: string } | undefined;
      const { userId } = metadata || {};

      logger.error(
        `[StripeService] Payment failed for user ${userId}: ${lastPaymentError?.message || 'Unknown error'}`
      );

      if (userId) {
        try {
          const amount = (paymentIntent.amount as number | undefined) || 0;
          await db.transaction.create({
            data: {
              userId,
              transactionType: 'TOP_UP',
              amount: amount / 100,
              balanceBefore: 0,
              balanceAfter: 0,
              status: 'failed',
              reference: paymentIntentId,
              failureReason: lastPaymentError?.message || 'Payment declined',
              metadata: {
                stripeError: lastPaymentError,
              },
            },
          });
        } catch (txError) {
          logger.error(
            `[StripeService] Error logging failed transaction`,
            txError instanceof Error ? txError : new Error(String(txError))
          );
        }
      }

      return {
        success: false,
        userId,
        paymentIntentId,
        error: lastPaymentError?.message,
      };
    } catch (error) {
      logger.error(
        `[StripeService] Error handling payment failure`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
private async handlePaymentIntentCanceled(paymentIntent: Record<string, unknown>) {
    try {
      const paymentIntentId = paymentIntent.id as string | undefined;
      const metadata = paymentIntent.metadata as PaymentIntentMetadata | undefined;
      const { userId } = metadata || {};

      logger.info(`[StripeService] Payment canceled for user ${userId}`);

      return {
        success: false,
        userId,
        paymentIntentId,
        error: 'Payment was canceled by user',
      };
    } catch (error) {
      logger.error(
        `[StripeService] Error handling payment cancellation`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
verifyWebhookSignature(body: string, signature: string, secret: string): StripeWebhookEvent {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, secret);
      return (event as unknown) as StripeWebhookEvent;
    } catch (error) {
      logger.error(
        `[StripeService] Webhook signature verification failed`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AppError(401, 'Webhook signature verification failed');
    }
  }
}

export const stripeService = new StripeService();



