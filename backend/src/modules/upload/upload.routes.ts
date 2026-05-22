import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '@middleware/auth';
import {
  uploadProfilePicture,
  uploadDocument,
  uploadPlanImage,
  uploadBlogFeaturedImage,
  deleteFile,
} from './upload.controller';
import {
  sanitizeFilename,
  MIME_TO_EXTENSION,
} from '@utils/fileSecurity';
import logger from '@utils/logger';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    try {
      const sanitized = sanitizeFilename(file.originalname);
      file.originalname = sanitized;
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedMimes.includes(file.mimetype)) {
        logger.warn(`[Upload] Invalid MIME type attempted: ${file.mimetype}`);
        cb(new Error(`Invalid file type: ${file.mimetype}`));
        return;
      }
      const ext = sanitized.substring(sanitized.lastIndexOf('.')).toLowerCase();
      const expectedMimes = Object.entries(MIME_TO_EXTENSION)
        .filter(([, exts]) => exts.includes(ext))
        .map(([mime]) => mime);

      if (expectedMimes.length > 0 && !expectedMimes.includes(file.mimetype)) {
        logger.warn(
          `[Upload] MIME type mismatch: ${file.mimetype} for extension ${ext}`
        );
        cb(
          new Error(
            `MIME type "${file.mimetype}" does not match extension "${ext}"`
          )
        );
        return;
      }

      cb(null, true);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`[Upload] File validation error:`, err);
      cb(new Error('File validation failed'));
    }
  },
});

const router = Router();
router.post('/profile-picture', authenticate, upload.single('file'), uploadProfilePicture);
router.post('/document', authenticate, upload.single('file'), uploadDocument);
router.post(
  '/plan-image',
  authenticate,
  authorize('ADMIN'),
  upload.single('file'),
  uploadPlanImage
);
router.post(
  '/blog-featured-image',
  authenticate,
  authorize('ADMIN'),
  upload.single('file'),
  uploadBlogFeaturedImage
);
router.delete('/', authenticate, deleteFile);

export default router;


