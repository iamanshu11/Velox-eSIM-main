import { Request, Response } from 'express';
import statusCode from 'http-status-codes';
import db from '@config/database';
import logger from '@utils/logger';
import { sendSuccess, sendError } from '@utils/response';
import { asyncHandler } from '@utils/errors';
import { AuthRequest } from '@/types';
import axios from 'axios';
import { config, secrets } from '@config/env';
import * as autoEmailTemplateService from '@/services/autoEmailTemplate.service';
import * as emailSchedulerService from '@/services/emailScheduler.service';
import * as emailSenderService from '@/services/emailSender.service';
import * as userClassificationService from '@/services/userClassification.service';
import * as abTestingService from '@/services/abTesting.service';
import * as segmentationService from '@/services/segmentation.service';
import type {
  CreateTemplateRequest,
  UpdateTemplateRequest,
  SendCustomEmailRequest,
  UpdateUserEmailStatusRequest,
  CreateAbTestRequest,
  ScheduleAbTestRequest,
  CompleteAbTestRequest,
  CreateSegmentRequest,
  UpdateSegmentRequest,
} from './autoEmails.types';

export const createTemplate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { title, subject, contentTemplate, aiPrompt } =
      req.body as unknown as CreateTemplateRequest;

    if (!title || !subject || !contentTemplate) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Missing required fields: title, subject, contentTemplate',
        statusCode.BAD_REQUEST
      );
    }

    const template = await autoEmailTemplateService.createTemplate({
      title,
      subject,
      contentTemplate,
      aiPrompt: aiPrompt || undefined,
      createdBy: req.user?.userId ?? '',
    });

    logger.info('[AutoEmailController] Template created', {
      templateId: template.id,
      createdBy: req.user?.userId,
    });

    return sendSuccess(res, 'Template created successfully', template, statusCode.CREATED);
  }
);

export const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const templates = await autoEmailTemplateService.listTemplates(includeInactive);
  return sendSuccess(res, 'Templates retrieved', templates);
});

export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const template = await autoEmailTemplateService.getTemplate(id);

  if (!template) {
    return sendError(res, 'NOT_FOUND', 'Template not found', statusCode.NOT_FOUND);
  }

  return sendSuccess(res, 'Template retrieved', template);
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { subject, contentTemplate, aiPrompt, isActive } =
    req.body as UpdateTemplateRequest;

  const template = await autoEmailTemplateService.updateTemplate(id, {
    subject,
    contentTemplate,
    aiPrompt,
    isActive,
  });

  if (!template) {
    return sendError(res, 'NOT_FOUND', 'Template not found', statusCode.NOT_FOUND);
  }

  logger.info('[AutoEmailController] Template updated', { templateId: id });
  return sendSuccess(res, 'Template updated successfully', template);
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await db.autoEmailTemplate.findUnique({ where: { id } });
  if (!template) {
    return sendError(res, 'NOT_FOUND', 'Template not found', statusCode.NOT_FOUND);
  }

  const activeSchedules = await db.autoEmailSchedule.count({
    where: {
      templateId: id,
      status: {
        in: ['pending', 'sent'],
      },
    },
  });

  if (activeSchedules > 0) {
    return sendError(
      res,
      'CONFLICT',
      `Cannot delete template with ${activeSchedules} active schedules`,
      statusCode.CONFLICT
    );
  }

  await autoEmailTemplateService.deleteTemplate(id);
  logger.info('[AutoEmailController] Template deleted', { templateId: id });
  return sendSuccess(res, 'Template deleted successfully', { id });
});

export const generateTemplateWithAI = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { prompt } = req.body as { prompt: string };

  if (!prompt || prompt.trim().length < 5) {
    return sendError(res, 'VALIDATION_ERROR', 'A prompt of at least 5 characters is required', statusCode.BAD_REQUEST);
  }

  if (!secrets.ai_api_key) {
    return sendError(res, 'SERVICE_UNAVAILABLE', 'AI service is not configured', statusCode.SERVICE_UNAVAILABLE);
  }

  const systemPrompt = `You are an expert email marketing copywriter. Generate professional, engaging HTML email templates for an eSIM service called "Velox eSIM".

Rules:
- Return ONLY valid JSON — no markdown, no code fences, no explanation
- The "title" must be a short internal name (3-6 words, title case, e.g. "Welcome New User Email")
- The "subject" must be a concise email subject line (max 80 chars)
- The "contentTemplate" must be valid HTML using inline-friendly tags: <h1>, <h2>, <p>, <strong>, <em>, <ul>, <li>, <a href="...">
- Use these personalization variables where natural: {{userName}}, {{userEmail}}, {{purchaseCount}}, {{lastPurchaseDate}}, {{currentDate}}
- Keep the tone professional yet friendly
- The HTML should look good when rendered in an email client

Return this exact JSON shape:
{
  "title": "...",
  "subject": "...",
  "contentTemplate": "..."
}`;

  try {
    const response = await axios.post(
      `${config.ai_base_url}/chat/completions`,
      {
        model: config.ai_model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${secrets.ai_api_key}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const raw = response.data?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return sendError(res, 'AI_ERROR', 'AI returned an empty response', statusCode.INTERNAL_SERVER_ERROR);
    }

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned) as { title: string; subject: string; contentTemplate: string };

    if (!parsed.title || !parsed.subject || !parsed.contentTemplate) {
      return sendError(res, 'AI_ERROR', 'AI response was missing required fields', statusCode.INTERNAL_SERVER_ERROR);
    }

    logger.info('[AutoEmailController] AI template generated', { createdBy: req.user?.userId });
    return sendSuccess(res, 'Template generated', {
      title: parsed.title,
      subject: parsed.subject,
      contentTemplate: parsed.contentTemplate,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'AI generation failed';
    logger.error('[AutoEmailController] AI generation error', { error: msg });
    return sendError(res, 'AI_ERROR', 'Failed to generate template. Try a different prompt.', statusCode.INTERNAL_SERVER_ERROR);
  }
});



export const getScheduleProgress = asyncHandler(
  async (_req: Request, res: Response) => {
    const [pending, sent, failed, cancelled] = await Promise.all([
      db.autoEmailSchedule.count({ where: { status: 'pending' } }),
      db.autoEmailSchedule.count({ where: { status: 'sent' } }),
      db.autoEmailSchedule.count({ where: { status: 'failed' } }),
      db.autoEmailSchedule.count({ where: { status: 'cancelled' } }),
    ]);

    return sendSuccess(res, 'Schedule progress retrieved', {
      total: pending + sent + failed + cancelled,
      pending,
      sent,
      failed,
      cancelled,
    });
  }
);

export const getEmailAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await db.emailLog.findMany({
    where: { sentAt: { gte: startDate } },
    select: {
      id: true,
      openedAt: true,
      clickedAt: true,
      unsubscribedAt: true,
      bounced: true,
    },
  });

  const totalSent = logs.length;
  const totalOpened = logs.filter((l) => l.openedAt).length;
  const totalClicked = logs.filter((l) => l.clickedAt).length;
  const totalUnsubscribed = logs.filter((l) => l.unsubscribedAt).length;
  const totalBounced = logs.filter((l) => l.bounced).length;

  return sendSuccess(res, 'Email analytics retrieved', {
    totalSent,
    totalOpened,
    totalClicked,
    totalUnsubscribed,
    totalBounced,
    openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0,
    bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
    period: `Last ${days} days`,
  });
});

export const getDeliveryReports = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;
  const templateId = req.query.templateId as string | undefined;

  const where = templateId ? { templateId } : {};

  const [logs, total] = await Promise.all([
    db.emailLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        template: { select: { id: true, title: true, subject: true } },
      },
      orderBy: { sentAt: 'desc' },
      skip,
      take: limit,
    }),
    db.emailLog.count({ where }),
  ]);

  return sendSuccess(res, 'Delivery reports retrieved', {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const sendCustomEmail = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { templateId, userIds, customContent, sendImmediately } =
      req.body as unknown as SendCustomEmailRequest;

    if (!templateId || !userIds || userIds.length === 0) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Missing required fields: templateId, userIds',
        statusCode.BAD_REQUEST
      );
    }

    if (userIds.length > 100) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Maximum 100 users per batch',
        statusCode.BAD_REQUEST
      );
    }

    const template = await autoEmailTemplateService.getTemplate(templateId);
    if (!template) {
      return sendError(res, 'NOT_FOUND', 'Template not found', statusCode.NOT_FOUND);
    }

    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, emailStatus: true, emailUnsubscribed: true },
    });

    const eligibleUsers = users.filter(
      (user) => !user.emailUnsubscribed && user.emailStatus !== 'inactive'
    );
    const skipped = userIds.length - eligibleUsers.length;

    let successful = 0;
    let failed = 0;

    if (sendImmediately) {
      for (const user of eligibleUsers) {
        const result = await emailSenderService.sendEmail(
          user.id,
          templateId,
          template.subject,
          customContent || template.contentTemplate
        );
        if (result.success) successful++;
        else failed++;
      }

      logger.info('[AutoEmailController] Custom emails sent immediately', { templateId, successful, failed });
      return sendSuccess(res, `${successful} email${successful !== 1 ? 's' : ''} sent`, {
        total: userIds.length,
        successful,
        failed,
        skipped,
      });
    }

    const scheduleIds: string[] = [];
    for (const user of eligibleUsers) {
      try {
        const schedule = await db.autoEmailSchedule.create({
          data: {
            userId: user.id,
            templateId,
            scheduledFor: new Date(),
            status: 'pending',
            draftReviewedAt: new Date(),
            draftReviewedBy: req.user?.userId ?? null,
            draftContent: customContent || template.contentTemplate,
          },
        });
        scheduleIds.push(schedule.id);
        successful++;
      } catch (userError) {
        failed++;
        logger.warn('[AutoEmailController] Error scheduling custom email', {
          userId: user.id,
          error: userError instanceof Error ? userError.message : String(userError),
        });
      }
    }

    logger.info('[AutoEmailController] Custom emails scheduled', { templateId, successful, failed });
    return sendSuccess(res, `${successful} email${successful !== 1 ? 's' : ''} queued for sending`, {
      total: userIds.length,
      successful,
      failed,
      skipped,
      scheduleIds,
    });
  }
);

export const updateUserEmailStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { emailStatus, emailUnsubscribed } =
      req.body as UpdateUserEmailStatusRequest;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User not found', statusCode.NOT_FOUND);
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        emailStatus: emailStatus || user.emailStatus,
        emailUnsubscribed:
          emailUnsubscribed !== undefined ? emailUnsubscribed : user.emailUnsubscribed,
      },
      select: { id: true, emailStatus: true, emailUnsubscribed: true },
    });

    logger.info('[AutoEmailController] User email status updated', { userId });
    return sendSuccess(res, 'User email status updated successfully', updatedUser);
  }
);


export const trackEmailOpen = asyncHandler(async (req: Request, res: Response) => {
  const { emailLogId } = req.params;
  await emailSenderService.trackEmailOpen(emailLogId);

  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.send(
    Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  );
});

export const unsubscribeUser = asyncHandler(async (req: Request, res: Response) => {
  const bodyToken = (req.body as { token?: string })?.token;
  const queryToken = req.query.token as string | undefined;
  const token = bodyToken || queryToken;

  if (!token) {
    return sendError(res, 'VALIDATION_ERROR', 'Token is required', statusCode.BAD_REQUEST);
  }

  const result = await emailSenderService.unsubscribeUser(token);

  if (!result) {
    return sendError(
      res,
      'NOT_FOUND',
      'Invalid or expired unsubscribe token',
      statusCode.NOT_FOUND
    );
  }

  return sendSuccess(res, 'You have been unsubscribed from our emails', {});
});

export const classifyUsersJob = asyncHandler(async (_req: Request, res: Response) => {
  const result = await userClassificationService.classifyAllUsers();
  logger.info('[AutoEmailController] User classification job triggered', result);
  return sendSuccess(res, 'User classification completed', result);
});

export const scheduleEmailsJob = asyncHandler(async (_req: Request, res: Response) => {
  const result = await emailSchedulerService.scheduleUserEmails();
  logger.info('[AutoEmailController] Email scheduling job triggered', result);
  return sendSuccess(res, 'Email scheduling completed', result);
});

export const listSchedules = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const status = req.query.status as string | undefined;
  const skip = (page - 1) * limit;
  const where = status && status !== 'all' ? { status } : {};

  const [schedules, total] = await Promise.all([
    db.autoEmailSchedule.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        template: { select: { id: true, title: true } },
      },
      orderBy: { scheduledFor: 'desc' },
      skip,
      take: limit,
    }),
    db.autoEmailSchedule.count({ where }),
  ]);

  return sendSuccess(res, 'Schedules retrieved', {
    schedules,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

export const cancelSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const schedule = await db.autoEmailSchedule.findUnique({ where: { id } });
  if (!schedule) {
    return sendError(res, 'NOT_FOUND', 'Schedule not found', statusCode.NOT_FOUND);
  }
  if (schedule.status !== 'pending') {
    return sendError(res, 'CONFLICT', 'Only pending schedules can be cancelled', statusCode.CONFLICT);
  }
  await db.autoEmailSchedule.update({ where: { id }, data: { status: 'cancelled' } });
  logger.info('[AutoEmailController] Schedule cancelled', { scheduleId: id });
  return sendSuccess(res, 'Schedule cancelled', { id });
});

export const processEmailsNow = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const pendingSchedules = await db.autoEmailSchedule.findMany({
    where: { status: 'pending', scheduledFor: { lte: now }, draftReviewedAt: { not: null } },
    include: { template: true },
    take: 50,
  });

  if (pendingSchedules.length === 0) {
    return sendSuccess(res, 'No pending emails due at this time', { total: 0, successful: 0, failed: 0 });
  }

  let successful = 0;
  let failed = 0;

  for (const schedule of pendingSchedules) {
    try {
      const content = schedule.draftContent || schedule.template.contentTemplate;
      const result = await emailSenderService.sendEmail(
        schedule.userId,
        schedule.templateId,
        schedule.template.subject,
        content
      );
      if (result.success) {
        await db.autoEmailSchedule.update({ where: { id: schedule.id }, data: { sentAt: now, status: 'sent' } });
        await db.user.update({ where: { id: schedule.userId }, data: { emailsSentCount: { increment: 1 } } });
        successful++;
      } else {
        await db.autoEmailSchedule.update({ where: { id: schedule.id }, data: { status: 'failed' } });
        failed++;
      }
    } catch {
      failed++;
      await db.autoEmailSchedule.update({ where: { id: schedule.id }, data: { status: 'failed' } }).catch(() => {});
    }
  }

  logger.info('[AutoEmailController] Process now completed', { total: pendingSchedules.length, successful, failed });
  return sendSuccess(res, `${successful} email${successful !== 1 ? 's' : ''} sent`, {
    total: pendingSchedules.length,
    successful,
    failed,
  });
});

export const createAbTest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { name, templateAId, templateBId, splitRatio } =
      req.body as unknown as CreateAbTestRequest;

    if (!name || !templateAId || !templateBId) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Missing required fields: name, templateAId, templateBId',
        statusCode.BAD_REQUEST
      );
    }

    if (splitRatio !== undefined && (splitRatio < 0 || splitRatio > 1)) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'splitRatio must be between 0.0 and 1.0',
        statusCode.BAD_REQUEST
      );
    }

    const test = await abTestingService.createAbTest({
      name,
      templateAId,
      templateBId,
      splitRatio: splitRatio ?? 0.5,
      createdBy: req.user?.userId ?? '',
    });

    logger.info('[AutoEmailController] A/B test created', { testId: test.id });
    return sendSuccess(res, 'A/B test created', test, statusCode.CREATED);
  }
);

export const listAbTests = asyncHandler(async (_req: Request, res: Response) => {
  const tests = await abTestingService.listAbTests();
  return sendSuccess(res, 'A/B tests retrieved', tests);
});

export const getAbTest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const test = await abTestingService.getAbTestWithResults(id);

  if (!test) {
    return sendError(res, 'NOT_FOUND', 'A/B test not found', statusCode.NOT_FOUND);
  }

  return sendSuccess(res, 'A/B test retrieved', test);
});

export const activateAbTest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const test = await abTestingService.activateAbTest(id);
  logger.info('[AutoEmailController] A/B test activated', { testId: id });
  return sendSuccess(res, 'A/B test activated', test);
});

export const completeAbTest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { winnerVariant } = req.body as CompleteAbTestRequest;

  const test = await abTestingService.completeAbTest(id, winnerVariant);
  logger.info('[AutoEmailController] A/B test completed', { testId: id, winnerVariant });
  return sendSuccess(res, 'A/B test completed', test);
});

export const scheduleAbTestEmails = asyncHandler(async (req: Request, res: Response) => {
  const { testId, userIds } = req.body as ScheduleAbTestRequest;

  if (!testId || !userIds || userIds.length === 0) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'Missing required fields: testId, userIds',
      statusCode.BAD_REQUEST
    );
  }

  const result = await abTestingService.scheduleAbTestEmails(testId, userIds);
  return sendSuccess(res, 'A/B test emails scheduled', result);
});

export const deleteAbTest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await abTestingService.deleteAbTest(id);
  logger.info('[AutoEmailController] A/B test deleted', { testId: id });
  return sendSuccess(res, 'A/B test deleted', { id });
});

export const createSegment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { name, description, rules } = req.body as unknown as CreateSegmentRequest;

    if (!name || !rules) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Missing required fields: name, rules',
        statusCode.BAD_REQUEST
      );
    }

    try {
      const segment = await segmentationService.createSegment({
        name,
        description,
        rules,
        createdBy: req.user?.userId ?? '',
      });

      logger.info('[AutoEmailController] Segment created', { segmentId: segment.id });
      return sendSuccess(res, 'Segment created', segment, statusCode.CREATED);
    } catch (error) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        error instanceof Error ? error.message : 'Invalid segment rules',
        statusCode.BAD_REQUEST
      );
    }
  }
);

export const listSegments = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const segments = await segmentationService.listSegments(includeInactive);
  return sendSuccess(res, 'Segments retrieved', segments);
});

export const getSegment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const segment = await segmentationService.getSegment(id);

  if (!segment) {
    return sendError(res, 'NOT_FOUND', 'Segment not found', statusCode.NOT_FOUND);
  }

  return sendSuccess(res, 'Segment retrieved', segment);
});

export const updateSegment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateSegmentRequest;

  try {
    const segment = await segmentationService.updateSegment(id, data);
    logger.info('[AutoEmailController] Segment updated', { segmentId: id });
    return sendSuccess(res, 'Segment updated', segment);
  } catch (error) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Invalid segment rules',
      statusCode.BAD_REQUEST
    );
  }
});

export const deleteSegment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await segmentationService.deleteSegment(id);
  logger.info('[AutoEmailController] Segment deleted', { segmentId: id });
  return sendSuccess(res, 'Segment deleted', { id });
});

export const evaluateSegment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userIds = await segmentationService.evaluateSegment(id);
    return sendSuccess(res, 'Segment evaluated', {
      segmentId: id,
      matchedUsers: userIds.length,
      userIds,
    });
  } catch (error) {
    return sendError(
      res,
      'NOT_FOUND',
      error instanceof Error ? error.message : 'Segment not found',
      statusCode.NOT_FOUND
    );
  }
});

export const previewSegment = asyncHandler(async (req: Request, res: Response) => {
  const { rules } = req.body as { rules: CreateSegmentRequest['rules'] };

  if (!rules || !Array.isArray(rules)) {
    return sendError(res, 'VALIDATION_ERROR', 'rules array is required', statusCode.BAD_REQUEST);
  }

  try {
    const matchedUsers = await segmentationService.previewSegment(rules);
    return sendSuccess(res, 'Segment preview calculated', { matchedUsers });
  } catch (error) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Invalid rules',
      statusCode.BAD_REQUEST
    );
  }
});
