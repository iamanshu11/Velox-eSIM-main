import { extname } from 'path';
import { randomBytes } from 'crypto';
import { AppError } from './errors';
export const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls'],
  profiles: ['.jpg', '.jpeg', '.png', '.webp'],
  plans: ['.jpg', '.jpeg', '.png', '.webp'],
};
export const MIME_TO_EXTENSION: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new AppError(400, 'Invalid filename');
  }
  const sanitized = filename
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/^\/+/, '')
    .replace(/^\.+/, '');

  const ext = extname(sanitized).toLowerCase();

  let baseName = sanitized.slice(0, sanitized.length - ext.length);
  baseName = baseName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100);

  if (!baseName) {
    throw new AppError(400, 'Invalid filename after sanitization');
  }

  return `${baseName}${ext}`;
}
export function generateSecureFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = extname(sanitized);
  const baseName = sanitized.slice(0, sanitized.length - ext.length);

  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  const uniquePrefix = `${timestamp}-${random}`;

  return `${uniquePrefix}_${baseName}${ext}`;
}
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): void {
  const ext = extname(filename).toLowerCase();

  if (!ext) {
    throw new AppError(400, 'File must have an extension');
  }

  if (!allowedExtensions.includes(ext)) {
    throw new AppError(
      400,
      `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`
    );
  }
}
export function validateMimeType(
  mimeType: string,
  allowedMimes: string[]
): void {
  if (!allowedMimes.includes(mimeType)) {
    throw new AppError(
      400,
      `Invalid file type. Allowed: ${allowedMimes.join(', ')}`
    );
  }
}
export function validateUploadFile(
  filename: string,
  mimeType: string,
  allowedExtensions: string[]
): void {
  validateFileExtension(filename, allowedExtensions);
  const ext = extname(filename).toLowerCase();
  const expectedMimes = Object.entries(MIME_TO_EXTENSION)
    .filter(([, exts]) => exts.includes(ext))
    .map(([mime]) => mime);

  if (expectedMimes.length > 0 && !expectedMimes.includes(mimeType)) {
    throw new AppError(
      400,
      `MIME type "${mimeType}" does not match file extension "${ext}". Expected: ${expectedMimes.join(', ')}`
    );
  }
}

export default {
  ALLOWED_EXTENSIONS,
  MIME_TO_EXTENSION,
  sanitizeFilename,
  generateSecureFilename,
  validateFileExtension,
  validateMimeType,
  validateUploadFile,
};
