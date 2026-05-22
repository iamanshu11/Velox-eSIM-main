import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import type { ApiResponse, UploadResponse } from '@/types';

export const uploadService = {
  uploadProfilePicture: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<UploadResponse>>(
        '/upload/profile-picture',
        formData
      );
      logger.debug('[UploadService] Profile picture uploaded successfully');
      return response.data as UploadResponse;
    } catch (error) {
      logger.error('[UploadService] uploadProfilePicture error', error);
      throw error;
    }
  },

  uploadDocument: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<UploadResponse>>(
        '/upload/document',
        formData
      );
      logger.debug('[UploadService] Document uploaded successfully');
      return response.data as UploadResponse;
    } catch (error) {
      logger.error('[UploadService] uploadDocument error', error);
      throw error;
    }
  },

  uploadPlanImage: async (file: File, planId: string): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('planId', planId);

      const response = await apiClient.post<ApiResponse<UploadResponse>>(
        '/upload/plan-image',
        formData
      );
      logger.debug('[UploadService] Plan image uploaded successfully');
      return response.data as UploadResponse;
    } catch (error) {
      logger.error('[UploadService] uploadPlanImage error', error);
      throw error;
    }
  },

  deleteFile: async (publicId: string): Promise<void> => {
    try {
      await apiClient.post<ApiResponse<void>>('/upload/delete', { publicId });
      logger.debug('[UploadService] File deleted successfully');
    } catch (error) {
      logger.error('[UploadService] deleteFile error', error);
      throw error;
    }
  },
};

export default uploadService;
