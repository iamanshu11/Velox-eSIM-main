import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import * as controller from './autoEmails.controller';
import * as emailWebhookController from './emailWebhook.controller';

const router = Router();

router.post(
  '/admin/auto-emails/templates',
  authenticate,
  authorize('ADMIN'),
  controller.createTemplate
);

router.get(
  '/admin/auto-emails/templates',
  authenticate,
  authorize('ADMIN'),
  controller.listTemplates
);

router.post(
  '/admin/auto-emails/templates/generate',
  authenticate,
  authorize('ADMIN'),
  controller.generateTemplateWithAI
);

router.get(
  '/admin/auto-emails/templates/:id',
  authenticate,
  authorize('ADMIN'),
  controller.getTemplate
);

router.put(
  '/admin/auto-emails/templates/:id',
  authenticate,
  authorize('ADMIN'),
  controller.updateTemplate
);

router.delete(
  '/admin/auto-emails/templates/:id',
  authenticate,
  authorize('ADMIN'),
  controller.deleteTemplate
);

router.get(
  '/admin/auto-emails/schedule',
  authenticate,
  authorize('ADMIN'),
  controller.getScheduleProgress
);

router.get(
  '/admin/auto-emails/analytics',
  authenticate,
  authorize('ADMIN'),
  controller.getEmailAnalytics
);

router.get(
  '/admin/auto-emails/delivery-reports',
  authenticate,
  authorize('ADMIN'),
  controller.getDeliveryReports
);

router.post(
  '/admin/auto-emails/send-custom',
  authenticate,
  authorize('ADMIN'),
  controller.sendCustomEmail
);

router.patch(
  '/admin/users/:userId/email-status',
  authenticate,
  authorize('ADMIN'),
  controller.updateUserEmailStatus
);

router.post(
  '/admin/auto-emails/classify-users',
  authenticate,
  authorize('ADMIN'),
  controller.classifyUsersJob
);

router.post(
  '/admin/auto-emails/schedule-emails',
  authenticate,
  authorize('ADMIN'),
  controller.scheduleEmailsJob
);

router.post(
  '/admin/auto-emails/process-now',
  authenticate,
  authorize('ADMIN'),
  controller.processEmailsNow
);

router.get(
  '/admin/auto-emails/schedules',
  authenticate,
  authorize('ADMIN'),
  controller.listSchedules
);

router.delete(
  '/admin/auto-emails/schedules/:id',
  authenticate,
  authorize('ADMIN'),
  controller.cancelSchedule
);

router.get('/email/track/pixel/:emailLogId', controller.trackEmailOpen);
router.get('/email/unsubscribe', controller.unsubscribeUser);
router.post('/email/unsubscribe', controller.unsubscribeUser);

router.post('/webhooks/email/mailgun', emailWebhookController.handleMailgunWebhook);
router.post('/webhooks/email/postmark', emailWebhookController.handlePostmarkWebhook);

export default router;
