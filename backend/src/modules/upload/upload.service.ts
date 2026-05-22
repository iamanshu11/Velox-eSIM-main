import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '@utils/errors';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  transformation?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export interface CloudinaryResult {
  secure_url?: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  [key: string]: unknown;
}

export interface CloudinaryError {
  message?: string;
  [key: string]: unknown;
}

export class UploadService {
  async uploadFile(fileBuffer: Buffer, fileName: string, options: UploadOptions = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'esim-resell',
          public_id: options.public_id || fileName.split('.')[0],
          resource_type: options.resource_type || 'auto',
          transformation: options.transformation,
        },
        (error: unknown, result: unknown) => {
          if (error) {
            const cloudinaryError = error as CloudinaryError;
            reject(
              new AppError(500, `Upload failed: ${cloudinaryError.message || 'Unknown error'}`)
            );
          } else {
            const cloudinaryResult = result as CloudinaryResult;
            resolve({
              url: cloudinaryResult.secure_url,
              publicId: cloudinaryResult.public_id,
              format: cloudinaryResult.format,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              size: cloudinaryResult.bytes,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  async deleteFile(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error: unknown) {
      throw new AppError(500, `Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileUrl(publicId: string, transformation?: Record<string, unknown>) {
    try {
      const url = cloudinary.url(publicId, {
        transformation,
      });
      return url;
    } catch (error: unknown) {
      throw new AppError(500, `URL generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uploadProfilePicture(fileBuffer: Buffer, userId: string) {
    return this.uploadFile(fileBuffer, `profile-${userId}`, {
      folder: 'esim-resell/profiles',
      public_id: userId,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      ],
    });
  }

  async uploadDocument(fileBuffer: Buffer, userId: string, documentType: string) {
    return this.uploadFile(fileBuffer, `doc-${userId}-${documentType}`, {
      folder: 'esim-resell/documents',
      resource_type: 'auto',
    });
  }

  async uploadPlanImage(fileBuffer: Buffer, planId: string) {
    return this.uploadFile(fileBuffer, `plan-${planId}`, {
      folder: 'esim-resell/plans',
      public_id: planId,
      resource_type: 'image',
      transformation: [
        { width: 300, height: 300, crop: 'fill' },
      ],
    });
  }
}

export const uploadService = new UploadService();




