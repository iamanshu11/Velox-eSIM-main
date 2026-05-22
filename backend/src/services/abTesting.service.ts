import db from '@config/database';
import logger from '@utils/logger';

export interface CreateAbTestDTO {
  name: string;
  templateAId: string;
  templateBId: string;
  splitRatio?: number;
  createdBy: string;
}
export const createAbTest = async (dto: CreateAbTestDTO) => {
  return db.emailAbTest.create({
    data: {
      name: dto.name,
      templateAId: dto.templateAId,
      templateBId: dto.templateBId,
      splitRatio: dto.splitRatio ?? 0.5,
      createdBy: dto.createdBy,
    },
    include: {
      templateA: { select: { id: true, title: true } },
      templateB: { select: { id: true, title: true } },
    },
  });
};
export const listAbTests = async () => {
  return db.emailAbTest.findMany({
    include: {
      templateA: { select: { id: true, title: true } },
      templateB: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
export const getAbTestWithResults = async (id: string) => {
  const test = await db.emailAbTest.findUnique({
    where: { id },
    include: {
      templateA: { select: { id: true, title: true } },
      templateB: { select: { id: true, title: true } },
    },
  });

  if (!test) return null;

  const [schedulesA, schedulesB] = await Promise.all([
    db.autoEmailSchedule.findMany({
      where: { abTestId: id, abVariant: 'A' },
      select: { id: true, status: true, userId: true },
    }),
    db.autoEmailSchedule.findMany({
      where: { abTestId: id, abVariant: 'B' },
      select: { id: true, status: true, userId: true },
    }),
  ]);

  const getMetrics = async (schedules: { id: string; userId: string }[]) => {
    const scheduleIds = schedules.map((s) => s.id);
    const userIds = schedules.map((s) => s.userId);

    const logs = await db.emailLog.findMany({
      where: { userId: { in: userIds }, templateId: { in: [test.templateAId, test.templateBId] } },
      select: { openedAt: true, clickedAt: true, unsubscribedAt: true },
    });

    const sent = scheduleIds.length;
    const opened = logs.filter((l) => l.openedAt).length;
    const clicked = logs.filter((l) => l.clickedAt).length;
    const unsubscribed = logs.filter((l) => l.unsubscribedAt).length;

    return {
      sent,
      opened,
      clicked,
      unsubscribed,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
    };
  };

  const [metricsA, metricsB] = await Promise.all([
    getMetrics(schedulesA),
    getMetrics(schedulesB),
  ]);

  return { ...test, metricsA, metricsB };
};
export const activateAbTest = async (id: string) => {
  return db.emailAbTest.update({
    where: { id },
    data: { status: 'active', startedAt: new Date() },
  });
};
export const completeAbTest = async (
  id: string,
  winnerVariant: 'A' | 'B' | null
) => {
  return db.emailAbTest.update({
    where: { id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      winnerVariant: winnerVariant ?? undefined,
    },
  });
};
export const deleteAbTest = async (id: string) => {
  return db.emailAbTest.delete({ where: { id } });
};
export const assignVariant = (splitRatio: number): 'A' | 'B' => {
  return Math.random() < splitRatio ? 'A' : 'B';
};
export const scheduleAbTestEmails = async (
  testId: string,
  userIds: string[]
) => {
  const test = await db.emailAbTest.findUnique({ where: { id: testId } });

  if (!test || test.status !== 'active') {
    throw new Error('A/B test not found or not active');
  }

  let successful = 0;
  let failed = 0;

  for (const userId of userIds) {
    const variant = assignVariant(test.splitRatio);
    const templateId = variant === 'A' ? test.templateAId : test.templateBId;

    try {
      await db.autoEmailSchedule.create({
        data: {
          userId,
          templateId,
          scheduledFor: new Date(),
          status: 'pending',
          abTestId: testId,
          abVariant: variant,
        },
      });
      successful++;
    } catch (error) {
      failed++;
      logger.warn('[AbTestService] Failed to schedule A/B test email', {
        userId,
        testId,
        variant,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('[AbTestService] A/B test emails scheduled', {
    testId,
    total: userIds.length,
    successful,
    failed,
  });

  return { total: userIds.length, successful, failed };
};
