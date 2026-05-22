import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';
import { config } from '@config/env';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

export const rateLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const baseOrigin = config.frontend_url;
  const allowedOrigins = baseOrigin ? [baseOrigin] : [];

  if (config.node_env === 'development' && baseOrigin === 'http://localhost:3000') {
    allowedOrigins.push('http://localhost:3001', 'http://localhost:3002');
  }

  const origin = req.headers.origin;

  if (origin && allowedOrigins.some(org => org === origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  return next();
};

export default {
  requestLogger,
  rateLimiter,
  corsMiddleware,
};
