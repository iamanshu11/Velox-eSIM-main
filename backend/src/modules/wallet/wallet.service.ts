import  prisma  from '@config/database';
import { AppError } from '@utils/errors';
import logger from '@utils/logger';

interface WalletData extends Record<string, unknown> {
  id: string;
  userId: string;
  balance: number;
  currency?: string;
}

interface Transaction extends Record<string, unknown> {
  id: string;
  userId: string;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}
export class WalletService {
async adjustBalance(
    userId: string,
    amount: number,
    direction: 'increase' | 'decrease',
    reference: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletData> {
    try {
      if (amount <= 0) {
        throw new AppError(400, 'Amount must be greater than 0');
      }

      const wallet = await this.getWallet(userId);
      const balanceBefore = wallet.balance;
      const balanceAfter = direction === 'increase'
        ? balanceBefore + amount
        : balanceBefore - amount;

      if (direction === 'decrease' && balanceAfter < 0) {
        throw new AppError(
          400,
          `Insufficient balance: Wallet balance: $${balanceBefore}, Adjustment: -$${amount}`
        );
      }

      const updatedWallet = await prisma.$transaction(async (tx) => {
        const walletResult = await tx.wallet.update({
          where: { userId },
          data: { balance: balanceAfter },
        });

        await tx.transaction.create({
          data: {
            userId,
            transactionType: 'ADMIN_ADJUSTMENT',
            amount,
            balanceBefore,
            balanceAfter,
            status: 'completed',
            reference,
            metadata: {
              ...metadata,
              direction,
            } as Record<string, string | number | boolean | null>,
          },
        });

        return walletResult;
      });

      logger.info(
        `[WalletService] Admin adjusted wallet: User ${userId}, Direction: ${direction}, Amount: $${amount}, New Balance: $${balanceAfter}`
      );

      return updatedWallet;
    } catch (error) {
      logger.error(
        `[WalletService] Error adjusting wallet for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
async initializeWallet(userId: string): Promise<WalletData> {
    try {
      const existingWallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (existingWallet) {
        logger.info(`[WalletService] Wallet already exists for user ${userId}`);
        return existingWallet;
      }

      const wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'USD',
        },
      });

      logger.info(`[WalletService] Wallet initialized for user ${userId}`);
      return wallet;
    } catch (error) {
      logger.error(
        `[WalletService] Error initializing wallet for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AppError(
        500,
        `Failed to initialize wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
async getWallet(userId: string): Promise<WalletData> {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return this.initializeWallet(userId);
      }

      return wallet;
    } catch (error) {
      logger.error(
        `[WalletService] Error fetching wallet for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AppError(
        500,
        `Failed to fetch wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
async getBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getWallet(userId);
      return wallet?.balance || 0;
    } catch (error) {
      logger.error(
        `[WalletService] Error getting balance for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      logger.error(
        `[WalletService] Error checking balance for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }
async addFunds(
    userId: string,
    amount: number,
    transactionId: string,
    reference?: string
  ): Promise<WalletData> {
    try {
      if (amount <= 0) {
        throw new AppError(400, 'Amount must be greater than 0');
      }

      const wallet = await this.getWallet(userId);
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;

      const updatedWallet = await prisma.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      });

      await prisma.transaction.create({
        data: {
          userId,
          transactionType: 'TOP_UP',
          amount,
          balanceBefore,
          balanceAfter,
          status: 'completed',
          reference: reference || transactionId,
          metadata: {
            chargeId: reference,
            transactionId,
          },
        },
      });

      logger.info(
        `[WalletService] Added funds: User ${userId}, Amount: $${amount}, New Balance: $${balanceAfter}`
      );

      return updatedWallet;
    } catch (error) {
      logger.error(
        `[WalletService] Error adding funds for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );

      try {
        await prisma.transaction.create({
          data: {
            userId,
            transactionType: 'TOP_UP',
            amount,
            balanceBefore: await this.getBalance(userId),
            balanceAfter: await this.getBalance(userId),
            status: 'failed',
            reference: transactionId,
            failureReason: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (txError) {
        logger.error(
          `[WalletService] Error logging failed transaction`,
          txError instanceof Error ? txError : new Error(String(txError))
        );
      }

      throw error;
    }
  }
async deductFunds(
    userId: string,
    amount: number,
    reference: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletData> {
    try {
      if (amount <= 0) {
        throw new AppError(400, 'Amount must be greater than 0');
      }

      const wallet = await this.getWallet(userId);
      const balanceBefore = wallet.balance;

      if (balanceBefore < amount) {
        throw new AppError(
          400,
          `Insufficient balance: Wallet balance: $${balanceBefore}, Required: $${amount}`
        );
      }

      const balanceAfter = balanceBefore - amount;

      const updatedWallet = await prisma.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      });

      await prisma.transaction.create({
        data: {
          userId,
          transactionType: 'ESIM_PURCHASE',
          amount,
          balanceBefore,
          balanceAfter,
          status: 'completed',
          reference,
          metadata: (metadata || {}) as Record<string, string | number | boolean | null>,
        },
      });

      logger.info(
        `[WalletService] Deducted funds: User ${userId}, Amount: $${amount}, New Balance: $${balanceAfter}`
      );

      return updatedWallet;
    } catch (error) {
      logger.error(
        `[WalletService] Error deducting funds for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );

      try {
        await prisma.transaction.create({
          data: {
            userId,
            transactionType: 'ESIM_PURCHASE',
            amount,
            balanceBefore: await this.getBalance(userId),
            balanceAfter: await this.getBalance(userId),
            status: 'failed',
            reference,
            failureReason: error instanceof Error ? error.message : 'Unknown error',
            metadata: (metadata || {}) as Record<string, string | number | boolean | null>,
          },
        });
      } catch (txError) {
        logger.error(
          `[WalletService] Error logging failed transaction`,
          txError instanceof Error ? txError : new Error(String(txError))
        );
      }

      throw error;
    }
  }
async refund(
    userId: string,
    amount: number,
    reference: string,
    reason?: string
  ): Promise<WalletData> {
    try {
      if (amount <= 0) {
        throw new AppError(400, 'Amount must be greater than 0');
      }

      const wallet = await this.getWallet(userId);
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;

      const updatedWallet = await prisma.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      });

      await prisma.transaction.create({
        data: {
          userId,
          transactionType: 'REFUND',
          amount,
          balanceBefore,
          balanceAfter,
          status: 'completed',
          reference,
          metadata: {
            reason,
          },
        },
      });

      logger.info(
        `[WalletService] Refunded funds: User ${userId}, Amount: $${amount}, New Balance: $${balanceAfter}`
      );

      return updatedWallet;
    } catch (error) {
      logger.error(
        `[WalletService] Error refunding funds for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ transactions: Transaction[]; total: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.transaction.count({
          where: { userId },
        }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        transactions: transactions as Transaction[],
        total,
        pages,
      };
    } catch (error) {
      logger.error(
        `[WalletService] Error fetching transaction history for user ${userId}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AppError(
        500,
        `Failed to fetch transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const walletService = new WalletService();



