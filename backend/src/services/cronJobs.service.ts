import cron from 'node-cron';
import logger from '@utils/logger';
import * as userClassificationService from '@/services/userClassification.service';
import * as emailSchedulerService from '@/services/emailScheduler.service';
import * as emailSenderService from '@/services/emailSender.service';
import * as emailGenerationService from '@/services/emailGeneration.service';
import db from '@config/database';
export const initializeCronJobs = (): void => {
  logger.info('[CronJobs] Initializing email automation jobs');

  scheduleUserClassificationJob();

  scheduleEmailSchedulingJob();

  scheduleBatchEmailSendJob();

  logger.success('[CronJobs] All email automation jobs initialized');
};
const scheduleUserClassificationJob = (): void => {
  const job = cron.schedule('0 0 * * *', async () => {
    logger.info('[CronJob:Classification] Starting user classification job');

    try {
      await userClassificationService.classifyAllUsers();

      logger.info('[CronJob:Classification] Job completed');
    } catch (error) {
      logger.error('[CronJob:Classification] Job failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('[CronJob:Classification] Scheduled for daily 00:00');
};
const scheduleEmailSchedulingJob = (): void => {
  const job = cron.schedule('0 6 * * *', async () => {
    logger.info('[CronJob:Scheduling] Starting email scheduling job');

    try {
      const result = await emailSchedulerService.scheduleUserEmails();

      logger.success('[CronJob:Scheduling] Job completed', {
        ...result,
      });
    } catch (error) {
      logger.error('[CronJob:Scheduling] Job failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('[CronJob:Scheduling] Scheduled for daily 06:00');
};
const scheduleBatchEmailSendJob = (): void => {
  const job = cron.schedule('*/15 * * * *', async () => {
    logger.info('[CronJob:BatchSend] Starting batch email send job');

    try {
      const startTime = Date.now();

      const pendingEmails = await emailSchedulerService.getPendingEmails();

      if (pendingEmails.length === 0) {
        logger.debug('[CronJob:BatchSend] No pending emails to send');
        return;
      }

      logger.info('[CronJob:BatchSend] Found pending emails', {
        count: pendingEmails.length,
      });

      let successful = 0;
      let failed = 0;

      for (const schedule of pendingEmails) {
        try {
          let emailContent = schedule.draftContent;

          if (!emailContent) {
            const personalized =
              await emailGenerationService.generatePersonalizedContent(
                schedule.template,
                schedule.user,
                schedule.templateId
              );

            if (!personalized) {
              logger.warn(
                '[CronJob:BatchSend] Failed to generate content',
                {
                  scheduleId: schedule.id,
                }
              );
              failed++;
              await emailSchedulerService.markScheduleAsFailed(
                schedule.id,
                2
              );
              continue;
            }

            emailContent = typeof personalized === 'string'
              ? personalized
              : (personalized as { subject: string; content: string }).content;
          }

          const sendResult = await emailSenderService.sendEmail(
            schedule.userId,
            schedule.templateId,
            schedule.template.subject,
            emailContent ?? ''
          );

          if (sendResult.success) {
            await emailSchedulerService.markScheduleAsSent(schedule.id);
            successful++;

            logger.debug('[CronJob:BatchSend] Email sent successfully', {
              scheduleId: schedule.id,
              emailLogId: sendResult.logId,
            });
          } else {
            failed++;
            await emailSchedulerService.markScheduleAsFailed(
              schedule.id,
              2
            );

            logger.warn('[CronJob:BatchSend] Email send failed', {
              scheduleId: schedule.id,
              error: sendResult.error,
            });
          }
        } catch (scheduleError) {
          failed++;
          logger.error('[CronJob:BatchSend] Error processing schedule', {
            scheduleId: schedule.id,
            error:
              scheduleError instanceof Error
                ? scheduleError.message
                : String(scheduleError),
          });

          try {
            await emailSchedulerService.markScheduleAsFailed(schedule.id, 2);
          } catch (failError) {
            logger.error('[CronJob:BatchSend] Error marking schedule failed', {
              scheduleId: schedule.id,
              error:
                failError instanceof Error
                  ? failError.message
                  : String(failError),
            });
          }
        }
      }

      const duration = Date.now() - startTime;

      logger.success('[CronJob:BatchSend] Job completed', {
        totalProcessed: pendingEmails.length,
        successful,
        failed,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('[CronJob:BatchSend] Job failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('[CronJob:BatchSend] Scheduled for every 15 minutes');
};
export const stopCronJobs = (): void => {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  logger.info('[CronJobs] All jobs stopped');
};
export const getCronJobsStatus = (): {
  running: boolean;
  taskCount: number;
} => {
  const tasks = cron.getTasks();
  return {
    running: tasks.size > 0,
    taskCount: tasks.size,
  };
};
