import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { verifyWebhookSignature } from '@/utils/webhookSecurity';
import logger from '@/utils/logger';
export function captureRawBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  let rawBody = '';

  req.on('data', (chunk) => {
    rawBody += chunk.toString('utf-8');
  });

  req.on('end', () => {
    (req as unknown as Record<string, unknown>).rawBody = rawBody;
    next();
  });
}

export function verifyWebhookSignatureMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const webhookSecret = process.env.ESIM_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      logger.warn('[Webhook Middleware] ESIM_WEBHOOK_SECRET not configured. Skipping signature verification (DEV ONLY)');
      
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(
          500,
          'Webhook secret not configured. Cannot verify signatures.'
        );
      }
      
      next();
      return;
    }

    verifyWebhookSignature(req, webhookSecret);
    
    logger.info('[Webhook Middleware] Signature verified successfully');
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook verification failed';
    logger.error('[Webhook Middleware] Verification failed:', new Error(message));
    
    res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_WEBHOOK_SIGNATURE',
        message: message,
        statusCode: 403,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default {
  captureRawBody,
  verifyWebhookSignatureMiddleware,
};
