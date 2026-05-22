import { createHmac } from 'crypto';
import { Request } from 'express';
import { AppError } from './errors';
const WEBHOOK_SIGNATURE_HEADER = 'x-webhook-signature';
const WEBHOOK_TIMESTAMP_HEADER = 'x-webhook-timestamp';
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;
export function generateWebhookSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
export function verifyWebhookSignature(req: Request, secret: string): void {
  const providedSignature = req.headers[WEBHOOK_SIGNATURE_HEADER] as string;
  if (!providedSignature) {
    throw new AppError(401, 'Missing webhook signature header');
  }

  const timestamp = req.headers[WEBHOOK_TIMESTAMP_HEADER] as string;
  if (!timestamp) {
    throw new AppError(401, 'Missing webhook timestamp header');
  }
  const webookTime = parseInt(timestamp, 10);
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - webookTime);

  if (timeDiff > TIMESTAMP_TOLERANCE_MS) {
    throw new AppError(
      401,
      `Webhook timestamp outside tolerance window. Diff: ${timeDiff}ms`
    );
  }
  interface RequestWithRawBody {
    rawBody?: string | Buffer;
  }
  const rawBody = (req as RequestWithRawBody).rawBody || JSON.stringify(req.body);

  const signedContent = `${rawBody}.${timestamp}`;

  const expectedSignature = generateWebhookSignature(signedContent, secret);
  if (!constantTimeCompare(providedSignature, expectedSignature)) {
    throw new AppError(401, 'Invalid webhook signature');
  }
}
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  }

  return result === 0;
}

export default {
  generateWebhookSignature,
  verifyWebhookSignature,
};

