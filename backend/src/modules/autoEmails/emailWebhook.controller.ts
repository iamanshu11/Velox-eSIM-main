import { Request, Response } from 'express';
import statusCode from 'http-status-codes';
import db from '@config/database';
import logger from '@utils/logger';
import { sendSuccess, sendError } from '@utils/response';
import { asyncHandler } from '@utils/errors';
import crypto from 'crypto';
const verifyMailgunSignature = (
  timestamp: string,
  token: string,
  signature: string,
  signingKey: string
): boolean => {
  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(timestamp + token);
  const digest = hmac.digest('hex');
  return digest === signature;
};
interface NormalizedEmailEvent {
  type: 'delivered' | 'bounced' | 'complained' | 'unsubscribed' | 'opened' | 'clicked' | 'unknown';
  recipient: string;
  timestamp: Date;
  deliveryMessage?: string;
}

const normalizeMailgunEvent = (body: Record<string, unknown>): NormalizedEmailEvent | null => {
  const eventData = body['event-data'] as Record<string, unknown> | undefined;
  if (!eventData) return null;

  const event = eventData.event as string;
  const recipient = eventData.recipient as string;
  const timestamp = new Date((eventData.timestamp as number) * 1000);

  const typeMap: Record<string, NormalizedEmailEvent['type']> = {
    delivered: 'delivered',
    failed: 'bounced',
    complained: 'complained',
    unsubscribed: 'unsubscribed',
    opened: 'opened',
    clicked: 'clicked',
  };

  return {
    type: typeMap[event] ?? 'unknown',
    recipient,
    timestamp,
    deliveryMessage:
      (eventData['delivery-status'] as Record<string, string>)?.message ?? undefined,
  };
};

const normalizePostmarkEvent = (body: Record<string, unknown>): NormalizedEmailEvent | null => {
  const event = body.RecordType as string;
  const recipient = (body.Recipient ?? body.Email) as string;
  const timestamp = new Date(body.DeliveredAt as string ?? body.BouncedAt as string ?? Date.now());

  const typeMap: Record<string, NormalizedEmailEvent['type']> = {
    Delivery: 'delivered',
    Bounce: 'bounced',
    SpamComplaint: 'complained',
    SubscriptionChange: 'unsubscribed',
    Open: 'opened',
    Click: 'clicked',
  };

  return {
    type: typeMap[event] ?? 'unknown',
    recipient,
    timestamp,
    deliveryMessage: body.Description as string | undefined,
  };
};
const applyEventToEmailLog = async (
  event: NormalizedEmailEvent
): Promise<boolean> => {
  const candidateLogs = await db.emailLog.findMany({
    where: {
      user: { email: event.recipient },
      sentAt: {
        lte: new Date(event.timestamp.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { sentAt: 'desc' },
    take: 20,
  });

  const emailLog = candidateLogs.length
    ? candidateLogs.reduce((best, current) => {
        const currentDiff = Math.abs(
          event.timestamp.getTime() - current.sentAt.getTime()
        );
        const bestDiff = Math.abs(event.timestamp.getTime() - best.sentAt.getTime());
        return currentDiff < bestDiff ? current : best;
      })
    : null;

  if (!emailLog) {
    logger.warn('[EmailWebhook] No email log found for recipient', {
      recipient: event.recipient,
    });
    return false;
  }

  const updates: Record<string, unknown> = {};

  switch (event.type) {
    case 'bounced':
      updates.bounced = true;
      updates.bouncedAt = event.timestamp;
      await db.user.updateMany({
        where: { email: event.recipient },
        data: { emailStatus: 'inactive' },
      });
      break;

    case 'complained':
      updates.unsubscribedAt = event.timestamp;
      await db.user.updateMany({
        where: { email: event.recipient },
        data: { emailUnsubscribed: true },
      });
      break;

    case 'unsubscribed':
      updates.unsubscribedAt = event.timestamp;
      await db.user.updateMany({
        where: { email: event.recipient },
        data: { emailUnsubscribed: true },
      });
      break;

    case 'opened':
      if (!emailLog.openedAt) {
        updates.openedAt = event.timestamp;
      }
      break;

    case 'clicked':
      if (!emailLog.clickedAt) {
        updates.clickedAt = event.timestamp;
      }
      break;

    case 'delivered':
    case 'unknown':
      break;
  }

  if (Object.keys(updates).length > 0) {
    await db.emailLog.update({
      where: { id: emailLog.id },
      data: updates,
    });
  }

  return true;
};
export const handleMailgunWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const signature = body.signature as Record<string, string> | undefined;

    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

    if (signingKey && signature) {
      const isValid = verifyMailgunSignature(
        signature.timestamp,
        signature.token,
        signature.signature,
        signingKey
      );

      if (!isValid) {
        logger.warn('[EmailWebhook] Invalid Mailgun signature');
        return sendError(
          res,
          'UNAUTHORIZED',
          'Invalid webhook signature',
          statusCode.UNAUTHORIZED
        );
      }
    }

    const event = normalizeMailgunEvent(body);

    if (!event || event.type === 'unknown') {
      return sendSuccess(res, 'Event acknowledged (no action)', {});
    }

    logger.info('[EmailWebhook] Mailgun event received', {
      type: event.type,
      recipient: event.recipient,
    });

    await applyEventToEmailLog(event);

    return sendSuccess(res, 'Webhook processed', {});
  }
);
export const handlePostmarkWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const event = normalizePostmarkEvent(body);

    if (!event || event.type === 'unknown') {
      return sendSuccess(res, 'Event acknowledged (no action)', {});
    }

    logger.info('[EmailWebhook] Postmark event received', {
      type: event.type,
      recipient: event.recipient,
    });

    await applyEventToEmailLog(event);

    return sendSuccess(res, 'Webhook processed', {});
  }
);
