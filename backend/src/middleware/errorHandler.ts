import { Request, Response, NextFunction } from 'express';
import { AppError, toError, getErrorMessage } from '@/utils/errors';
import logger from '@/utils/logger';
import { HTTP_STATUS, ERROR_CODES } from '@/constants/http';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    requestId?: string;
  };
}
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function getErrorCode(error: unknown): string {
  if (error instanceof AppError) {
    if (error.statusCode === 400) return ERROR_CODES.INVALID_INPUT;
    if (error.statusCode === 401) return ERROR_CODES.UNAUTHORIZED;
    if (error.statusCode === 403) return ERROR_CODES.FORBIDDEN;
    if (error.statusCode === 404) return ERROR_CODES.NOT_FOUND;
    if (error.statusCode === 409) return ERROR_CODES.CONFLICT;
    if (error.statusCode === 422) return ERROR_CODES.INVALID_FORMAT;
    if (error.statusCode === 429) return ERROR_CODES.TOO_MANY_REQUESTS;
    if (error.statusCode >= 500) return ERROR_CODES.INTERNAL_ERROR;
  }

  const message = getErrorMessage(error);
  if (message.toLowerCase().includes('validation')) return ERROR_CODES.INVALID_INPUT;
  if (message.toLowerCase().includes('not found')) return ERROR_CODES.NOT_FOUND;
  if (message.toLowerCase().includes('unauthorized')) return ERROR_CODES.UNAUTHORIZED;
  if (message.toLowerCase().includes('forbidden')) return ERROR_CODES.FORBIDDEN;
  if (message.toLowerCase().includes('conflict')) return ERROR_CODES.CONFLICT;

  return ERROR_CODES.INTERNAL_ERROR;
}
function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (error instanceof SyntaxError) {
    return HTTP_STATUS.BAD_REQUEST;
  }
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}
export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = generateRequestId();
  const statusCode = getStatusCode(err);
  const errorCode = getErrorCode(err);
  const message = getErrorMessage(err);

  logger.error(`[${requestId}] Error in ${req.method} ${req.path}`, toError(err));

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'An internal error occurred. Please try again later.'
        : message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: process.env.NODE_ENV === 'development' ? requestId : undefined,
    },
  };

  res.status(statusCode).json(errorResponse);
};
export const asyncWrapper = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
export const errorTriggerMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.query.__trigger_error === 'true' && process.env.NODE_ENV === 'development') {
    throw new Error('Intentional error for testing');
  }
  return next();
};
