import { Router, Response } from 'express';
import { authenticate } from '@middleware/auth';
import { walletService } from './wallet.service';
import { stripeService } from '@modules/payments/stripe.service';
import { asyncHandler } from '@utils/errors';
import { sendError, sendSuccess } from '@utils/response';
import statusCode from 'http-status-codes';
import logger from '@utils/logger';
import referralRoutes from './referral.routes';
import { AuthRequest } from '@/types';

const router = Router();

router.use(referralRoutes);
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.userId;
      if (!userId) {
        return sendError(res, 'Unauthorized', '', statusCode.UNAUTHORIZED);
      }
      const wallet = await walletService.getWallet(userId);
      return sendSuccess(res, 'Wallet fetched successfully', {
        balance: wallet.balance,
        currency: wallet.currency,
      });
    } catch (error) {
      return sendError(
        res,
        'Failed to fetch wallet',
        error instanceof Error ? error.message : 'Unknown error',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.get(
  '/balance',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.userId;

      if (!userId) {
        return sendError(res, 'Unauthorized', '', statusCode.UNAUTHORIZED);
      }

      const wallet = await walletService.getWallet(userId);

      return sendSuccess(res, 'Wallet balance fetched successfully', {
        balance: wallet.balance,
        currency: wallet.currency,
      });
    } catch (error) {
      logger.error(
        '[WalletRoutes] Error fetching wallet balance',
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        'Failed to fetch wallet balance',
        error instanceof Error ? error.message : 'Unknown error',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.get(
  '/transactions',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return sendError(res, 'Unauthorized', '', statusCode.UNAUTHORIZED);
      }

      if (page < 1 || limit < 1 || limit > 100) {
        return sendError(
          res,
          'Invalid pagination parameters',
          'Page and limit must be positive, limit max 100',
          statusCode.BAD_REQUEST
        );
      }

      const { transactions, total, pages } = await walletService.getTransactionHistory(
        userId,
        page,
        limit
      );

      return sendSuccess(res, 'Transaction history fetched successfully', {
        transactions,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: pages,
        },
      });
    } catch (error) {
      logger.error(
        '[WalletRoutes] Error fetching transaction history',
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        'Failed to fetch transaction history',
        error instanceof Error ? error.message : 'Unknown error',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.post(
  '/top-up/initiate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.userId;
      const userEmail = (req as AuthRequest).user?.email;
      const { amount } = req.body as Record<string, unknown>;

      if (!userId || !userEmail) {
        return sendError(res, 'Unauthorized', '', statusCode.UNAUTHORIZED);
      }

      if (!amount || typeof amount !== 'number') {
        return sendError(
          res,
          'Invalid amount',
          'Amount is required and must be a number',
          statusCode.BAD_REQUEST
        );
      }

      if (amount <= 0) {
        return sendError(
          res,
          'Invalid amount',
          'Amount must be greater than 0',
          statusCode.BAD_REQUEST
        );
      }

      logger.info(`[WalletRoutes] Initiating top-up for user ${userId}, amount: $${amount}`);

      const paymentIntent = await stripeService.createTopUpPaymentIntent(
        userId,
        amount,
        userEmail
      );

      return sendSuccess(res, 'Payment intent created successfully', paymentIntent);
    } catch (error) {
      logger.error(
        '[WalletRoutes] Error initiating top-up',
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        'Failed to initiate top-up',
        error instanceof Error ? error.message : 'Unknown error',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);
router.post(
  '/top-up/confirm',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.userId;
      const { paymentIntentId } = req.body as Record<string, unknown>;

      if (!userId) {
        return sendError(res, 'Unauthorized', '', statusCode.UNAUTHORIZED);
      }

      if (!paymentIntentId || typeof paymentIntentId !== 'string') {
        return sendError(
          res,
          'Invalid payment intent ID',
          'paymentIntentId is required and must be a string',
          statusCode.BAD_REQUEST
        );
      }

      logger.info(
        `[WalletRoutes] Confirming payment for user ${userId}, payment intent: ${paymentIntentId}`
      );

      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      const paymentIntentData = paymentIntent as Record<string, unknown>;

      const metadata = paymentIntentData.metadata as Record<string, unknown>;
      if (metadata?.userId !== userId) {
        return sendError(
          res,
          'Invalid payment intent',
          'Payment intent does not belong to this user',
          statusCode.FORBIDDEN
        );
      }

      if (paymentIntentData.status !== 'succeeded') {
        return sendError(
          res,
          'Payment not completed',
          `Payment status: ${paymentIntentData.status}`,
          statusCode.BAD_REQUEST
        );
      }

      const topUpAmount = (paymentIntentData.amount as number) / 100;
      const updatedWallet = await walletService.addFunds(
        userId,
        topUpAmount,
        paymentIntentId,
        paymentIntentId
      );

      logger.info(
        `[WalletRoutes] Top-up confirmed for user ${userId}, amount: $${topUpAmount}, new balance: $${updatedWallet.balance}`
      );

      return sendSuccess(res, 'Top-up confirmed and funds added', {
        balance: updatedWallet.balance,
        amount: topUpAmount,
        currency: updatedWallet.currency,
      });
    } catch (error) {
      logger.error(
        '[WalletRoutes] Error confirming top-up',
        error instanceof Error ? error : new Error(String(error))
      );
      return sendError(
        res,
        'Failed to confirm top-up',
        error instanceof Error ? error.message : 'Unknown error',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  })
);

export default router;



