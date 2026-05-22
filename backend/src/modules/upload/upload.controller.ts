import { Request, Response } from 'express';
import { asyncHandler } from '@utils/errors';
import { sendSuccess, sendError } from '@utils/response';
import { uploadService } from './upload.service';

export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', undefined, 401);
  }

  if (!req.file) {
    return sendError(res, 'No file uploaded', undefined, 400);
  }

  const result = await uploadService.uploadProfilePicture(req.file.buffer, req.user.userId);

  return sendSuccess(res, 'Profile picture uploaded successfully', result, 201);
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', undefined, 401);
  }

  if (!req.file) {
    return sendError(res, 'No file uploaded', undefined, 400);
  }

  const { documentType } = req.body;

  if (!documentType) {
    return sendError(res, 'Document type is required', undefined, 400);
  }

  const result = await uploadService.uploadDocument(
    req.file.buffer,
    req.user.userId,
    documentType
  );

  return sendSuccess(res, 'Document uploaded successfully', result, 201);
});

export const uploadPlanImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', undefined, 401);
  }

  if (!req.file) {
    return sendError(res, 'No file uploaded', undefined, 400);
  }

  const { planId } = req.body;

  if (!planId) {
    return sendError(res, 'Plan ID is required', undefined, 400);
  }

  const result = await uploadService.uploadPlanImage(req.file.buffer, planId);

  return sendSuccess(res, 'Plan image uploaded successfully', result, 201);
});

export const uploadBlogFeaturedImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', undefined, 401);
  }

  if (!req.file) {
    return sendError(res, 'No file uploaded', undefined, 400);
  }

  const result = await uploadService.uploadFile(req.file.buffer, req.file.originalname, {
    folder: 'esim-blog',
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 630, crop: 'fill', gravity: 'auto' },
      { quality: 'auto' },
    ],
  });

  return sendSuccess(res, 'Blog featured image uploaded successfully', result, 201);
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', undefined, 401);
  }

  const { publicId } = req.body;

  if (!publicId) {
    return sendError(res, 'Public ID is required', undefined, 400);
  }

  const result = await uploadService.deleteFile(publicId);

  return sendSuccess(res, 'File deleted successfully', result);
});
