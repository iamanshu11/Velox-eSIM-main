import { Response } from 'express';
import { HTTP_STATUS } from '@/constants/http';
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
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
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};
export const sendError = (
  res: Response,
  codeOrMessage: string,
  messageOrError?: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  path?: string,
  requestId?: string
): Response => {
  const isOldFormat = messageOrError === undefined && statusCode >= 100 && statusCode < 600;
  
  if (isOldFormat) {
    const message = codeOrMessage;
    
    interface OldErrorResponse {
      success: false;
      message: string;
      error?: string;
    }
    const response: OldErrorResponse = {
      success: false,
      message,
    };
    if (messageOrError) {
      response.error = messageOrError;
    }
    return res.status(statusCode).json(response);
  }

  const code = codeOrMessage;
  const message = messageOrError || 'Unknown error';
  
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    },
  };
  return res.status(statusCode).json(response);
};
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Data fetched successfully'
): Response => {
  const totalPages = Math.ceil(total / limit);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export default {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
};

