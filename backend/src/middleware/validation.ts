import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@utils/errors';
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);

      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        const errorMessage = `Validation failed: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
        return next(new AppError(400, errorMessage));
      }
      
      next(error);
    }
  };
};
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);

      req.query = validated as Record<string, string | string[]>;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        const errorMessage = `Query validation failed: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
        return next(new AppError(400, errorMessage));
      }
      
      next(error);
    }
  };
};
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);

      req.params = validated as Record<string, string>;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        const errorMessage = `Parameter validation failed: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
        return next(new AppError(400, errorMessage));
      }
      
      next(error);
    }
  };
};
