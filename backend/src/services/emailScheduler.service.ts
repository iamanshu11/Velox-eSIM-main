import db from '@config/database';
import logger from '@utils/logger';

const MIN_DAYS_BETWEEN_EMAILS = 2;
const ACTIVE_USER_EMAIL_BUDGET = 50;
const NEW_USER_EMAIL_BUDGET = 5;
export const scheduleUserEmails = async (): Promise<{
  newQueued: number;
  skipped: number;
}> => {
  try {
    logger.info('[EmailScheduler] Starting email scheduling job');

    const users = await db.user.findMany({
      where: {
        emailUnsubscribed: false,
        emailStatus: {
          in: ['active', 'new'],
        },
      },
      select: {
        id: true,
        emailStatus: true,
        emailsSentCount: true,
        activatedAt: true,
        createdAt: true,
      },
    });

    let newQueued = 0;
    let skipped = 0;

    for (const user of users) {
      const canReceiveEmail = await canUserReceiveEmail(user);

      if (!canReceiveEmail) {
        skipped++;
        logger.debug('[EmailScheduler] User email budget exceeded', {
          userId: user.id,
          status: user.emailStatus,
          sentCount: user.emailsSentCount,
        });
        continue;
      }

      const lastEmailSent = await db.emailLog.findFirst({
        where: { userId: user.id },
        orderBy: { sentAt: 'desc' },
        select: { sentAt: true },
      });

      if (lastEmailSent) {
        const daysSinceLastEmail =
          (Date.now() - lastEmailSent.sentAt.getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysSinceLastEmail < MIN_DAYS_BETWEEN_EMAILS) {
          skipped++;
          logger.debug('[EmailScheduler] Cooldown period active', {
            userId: user.id,
            daysSinceLastEmail,
          });
          continue;
        }
      }

      const template = await getRandomTemplate();
      if (!template) {
        logger.warn('[EmailScheduler] No active templates found');
        skipped++;
        continue;
      }

      const scheduledFor = getRandomScheduledDate();

      try {
        await db.autoEmailSchedule.create({
          data: {
            userId: user.id,
            templateId: template.id,
            scheduledFor,
            status: 'pending',
            draftReviewedAt: new Date(),
            draftReviewedBy: 'system',
          },
        });

        newQueued++;
      } catch (createError) {
        logger.error('[EmailScheduler] Error scheduling email', {
          userId: user.id,
          templateId: template.id,
          error:
            createError instanceof Error
              ? createError.message
              : String(createError),
        });
      }
    }

    logger.info('[EmailScheduler] Scheduling job completed', {
      totalUsers: users.length,
      newQueued,
      skipped,
    });

    return { newQueued, skipped };
  } catch (error) {
    logger.error('[EmailScheduler] Error in scheduling job', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { newQueued: 0, skipped: 0 };
  }
};
const canUserReceiveEmail = async (user: {
  id: string;
  emailStatus: string;
  emailsSentCount: number;
  activatedAt: Date | null;
  createdAt: Date;
}): Promise<boolean> => {
  const now = new Date();

    if (user.emailStatus === 'new') {
      const creationDate = new Date(user.createdAt);
    const sevenDaysLater = new Date(
      creationDate.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    if (now > sevenDaysLater) {
      return true;
    }

    return user.emailsSentCount < NEW_USER_EMAIL_BUDGET;
  }

  if (user.emailStatus === 'active') {
    const activationDate = user.activatedAt || user.createdAt;
    const oneEightyDaysLater = new Date(
      activationDate.getTime() + 180 * 24 * 60 * 60 * 1000
    );

    if (now > oneEightyDaysLater) {
      await resetEmailCount(user.id);
      return true;
    }

    return user.emailsSentCount < ACTIVE_USER_EMAIL_BUDGET;
  }

  return false;
};
const getRandomTemplate = async () => {
  try {
    const count = await db.autoEmailTemplate.count({
      where: { isActive: true },
    });

    if (count === 0) return null;

    const randomIndex = Math.floor(Math.random() * count);

    const template = await db.autoEmailTemplate.findMany({
      where: { isActive: true },
      skip: randomIndex,
      take: 1,
    });

    return template[0] || null;
  } catch (error) {
    logger.error('[EmailScheduler] Error fetching random template', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
const getRandomScheduledDate = (): Date => {
  const now = new Date();
  const daysOffset = Math.floor(Math.random() * 7) + 1;
  const hoursOffset = Math.floor(Math.random() * 24);
  const minutesOffset = Math.floor(Math.random() * 60);

  return new Date(
    now.getTime() +
      daysOffset * 24 * 60 * 60 * 1000 +
      hoursOffset * 60 * 60 * 1000 +
      minutesOffset * 60 * 1000
  );
};
const resetEmailCount = async (userId: string): Promise<void> => {
  try {
    await db.user.update({
      where: { id: userId },
      data: { emailsSentCount: 0 },
    });
  } catch (error) {
    logger.error('[EmailScheduler] Error resetting email count', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const getPendingEmails = async () => {
  try {
    const now = new Date();

    const pending = await db.autoEmailSchedule.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now,
        },
        draftReviewedAt: {
          not: null,
        },
      },
      include: {
        user: true,
        template: true,
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      take: 100,
    });

    return pending;
  } catch (error) {
    logger.error('[EmailScheduler] Error fetching pending emails', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};
export const markScheduleAsSent = async (
  scheduleId: string
): Promise<boolean> => {
  try {
    const schedule = await db.autoEmailSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) return false;

    await db.autoEmailSchedule.update({
      where: { id: scheduleId },
      data: {
        sentAt: new Date(),
        status: 'sent',
      },
    });

    await db.user.update({
      where: { id: schedule.userId },
      data: {
        emailsSentCount: {
          increment: 1,
        },
      },
    });

    return true;
  } catch (error) {
    logger.error('[EmailScheduler] Error marking schedule as sent', {
      scheduleId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};
export const markScheduleAsFailed = async (
  scheduleId: string,
  retryCount: number = 3
): Promise<boolean> => {
  try {
    await db.autoEmailSchedule.update({
      where: { id: scheduleId },
      data: {
        status: 'failed',
      },
    });

    if (retryCount > 0) {
      logger.warn('[EmailScheduler] Schedule marked failed without retry to avoid infinite loops', {
        scheduleId,
        requestedRetryCount: retryCount,
      });
    }

    return true;
  } catch (error) {
    logger.error('[EmailScheduler] Error marking schedule as failed', {
      scheduleId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};
