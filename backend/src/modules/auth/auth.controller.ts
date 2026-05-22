import { Request, Response, NextFunction } from 'express';
import {
  register,
  login,
  getProfile,
  refreshAccessToken,
  logout,
  logoutAll,
  changePassword,
  updateProfile,
  AuthServiceResponse,
} from './auth.service';
import { AuthRequest } from '@/types';
import { AppError } from '@utils/errors';
import logger from '@utils/logger';
import { z } from 'zod';
import { resolveCountryFromRequest } from '@utils/ipLocation';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '@validators/auth.validator';

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const location = (await resolveCountryFromRequest(req)) ?? validatedData.location ?? null;
    const result: AuthServiceResponse = await register({ ...validatedData, location } as typeof validatedData & { location?: unknown });

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const location = (await resolveCountryFromRequest(req)) ?? validatedData.location ?? null;
    const result: AuthServiceResponse = await login({ ...validatedData, location } as typeof validatedData & { location?: unknown });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    logger.success('[LOGIN] Tokens generated for user', { email: result.user.email });

    res.json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
};

export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }
    const user = await getProfile(req.user.userId);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body?.refreshToken;
    const refreshToken = (tokenFromCookie || tokenFromBody) as string | undefined;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return next(new AppError(400, 'Refresh token is required'));
    }

    const result = await refreshAccessToken(refreshToken);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
};

export const logoutController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body?.refreshToken;
    const refreshToken = (tokenFromCookie || tokenFromBody) as string | undefined;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return next(new AppError(400, 'Refresh token is required'));
    }

    let result;
    try {
      result = await logout(refreshToken);
    } finally {
      const clearOptions = {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
      };
      res.clearCookie('accessToken', clearOptions);
      res.clearCookie('refreshToken', clearOptions);
    }

    res.json(result || { message: 'Logged out' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
};

export const logoutAllController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }
    const result = await logoutAll(req.user.userId);

    const clearOptions = {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
    };
    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const changePasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }
    const validatedData = changePasswordSchema.parse(req.body);
    const result = await changePassword(
      req.user.userId,
      validatedData.oldPassword,
      validatedData.newPassword
    );
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
};

export const updateProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'email')) {
      return next(new AppError(400, 'Email changes are not supported in profile settings'));
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const result = await updateProfile(req.user.userId, validatedData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
};
