import { Response, NextFunction } from 'express';
import { verifyToken } from '@/config/jwt';
import { AuthRequest } from '@/types';
import { sendError } from '@/utils/response';
import statusCode from 'http-status-codes';

export { AuthRequest, CustomUser } from '@/types';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(
        res,
        'UNAUTHORIZED',
        'No token provided',
        statusCode.UNAUTHORIZED
      );
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Invalid or expired token';
    return sendError(
      res,
      'AUTH_FAILED',
      errorMsg,
      statusCode.UNAUTHORIZED
    );
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(
        res,
        'UNAUTHORIZED',
        'User not authenticated',
        statusCode.UNAUTHORIZED
      );
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        'FORBIDDEN',
        'Insufficient permissions',
        statusCode.FORBIDDEN
      );
    }

    return next();
  };
};
