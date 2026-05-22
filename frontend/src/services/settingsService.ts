import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import type { ApiResponse, Settings, ProfitMargin } from '@/types';

export const settingsService = {
  getSettings: async (): Promise<Settings> => {
    try {
      const response = await apiClient.get<ApiResponse<Settings>>(
        '/settings'
      );
      return (response.data as any)?.data ?? ({} as Settings);
    } catch (error) {
      logger.error('[SettingsService] getSettings error', error);
      throw error;
    }
  },

  updateSettings: async (data: Partial<Settings>): Promise<Settings> => {
    try {
      const response = await apiClient.put<ApiResponse<Settings>>(
        '/settings',
        data
      );
      logger.debug('[SettingsService] Settings updated successfully');
      return (response.data as any)?.data ?? ({} as Settings);
    } catch (error) {
      logger.error('[SettingsService] updateSettings error', error);
      throw error;
    }
  },

  getProfitMargin: async (): Promise<ProfitMargin> => {
    try {
      const response = await apiClient.get<ApiResponse<ProfitMargin>>(
        '/settings/profit-margin'
      );
      return (response.data as any)?.data ?? ({} as ProfitMargin);
    } catch (error) {
      logger.error('[SettingsService] getProfitMargin error', error);
      throw error;
    }
  },

  updateProfitMargin: async (
    data: Partial<ProfitMargin>
  ): Promise<ProfitMargin> => {
    try {
      const response = await apiClient.put<ApiResponse<ProfitMargin>>(
        '/settings/profit-margin',
        data
      );
      logger.debug('[SettingsService] Profit margin updated successfully');
      return (response.data as any)?.data ?? ({} as ProfitMargin);
    } catch (error) {
      logger.error('[SettingsService] updateProfitMargin error', error);
      throw error;
    }
  },
};

export default settingsService;
