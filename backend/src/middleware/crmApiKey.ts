import { Request, Response, NextFunction } from 'express';

/**
 * CRM API Key Middleware
 *
 * Protects /api/crm/* routes.
 * The CRM backend must send the key in the request header:
 *   x-api-key: <CRM_API_KEY from .env>
 *
 * No user login required — this is server-to-server authentication.
 */
export function crmApiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.CRM_API_KEY;

  // If no key is configured, block all access
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'CRM_API_KEY is not configured on the server.',
    });
  }

  const sentKey = req.headers['x-api-key'];

  if (!sentKey || sentKey !== apiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key. Send your key in the x-api-key header.',
    });
  }

  return next();
}
