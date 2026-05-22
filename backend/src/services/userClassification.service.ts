import db from '@config/database';
import logger from '@utils/logger';
export const classifyUser = async (userId: string): Promise<string> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        lastActivityAt: true,
        emailStatus: true,
      },
    });

    if (!user) {
      logger.warn('[UserClassification] User not found', { userId });
      return 'new';
    }

    const now = new Date();
    const accountAgeMs = now.getTime() - user.createdAt.getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

    const purchaseCount = await db.transaction.count({
      where: {
        userId,
        transactionType: 'ESIM_PURCHASE',
        status: 'completed',
      },
    });

    if (purchaseCount === 0 || accountAgeDays < 7) {
      return 'new';
    }

    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentActivity =
      user.lastActivityAt && user.lastActivityAt > sixtyDaysAgo;

    const recentPurchaseCount = await db.transaction.count({
      where: {
        userId,
        transactionType: 'ESIM_PURCHASE',
        status: 'completed',
        createdAt: {
          gte: sixtyDaysAgo,
        },
      },
    });

    if (recentActivity || recentPurchaseCount > 0) {
      return 'active';
    }

    return 'inactive';
  } catch (error) {
    logger.error('[UserClassification] Error classifying user', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 'new';
  }
};
export const classifyAllUsers = async (): Promise<{
  total: number;
  updated: number;
}> => {
  try {
    logger.info('[UserClassification] Starting user classification job');

    const users = await db.user.findMany({
      where: {
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        activatedAt: true,
      },
    });

    let updated = 0;
    for (const user of users) {
      const status = await classifyUser(user.id);

      if (!status) {
        continue;
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          emailStatus: status,
          activatedAt:
            status === 'active'
              ? user.activatedAt || new Date()
              : undefined,
        },
      });
      updated++;
    }

    logger.info('[UserClassification] User classification completed', {
      total: users.length,
      updated,
    });
    return { total: users.length, updated };
  } catch (error) {
    logger.error('[UserClassification] Error in classification job', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { total: 0, updated: 0 };
  }
};
export const recordUserActivity = async (userId: string): Promise<void> => {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        lastActivityAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('[UserClassification] Error recording activity', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
