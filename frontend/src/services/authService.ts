import { apiClient } from '@lib/apiClient';
import logger from '@lib/logger';
import type { User, ApiResponse } from '@/types';
import { resolveBrowserCountryLocation } from '@/lib/browserCountryLocation';

interface LoginResponse {
  user: User;
}

interface RegisterResponse {
  user: User;
}

export const authService = {
  async register(data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<RegisterResponse> {
    try {
      const location = await resolveBrowserCountryLocation();
      const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', {
        ...data,
        ...(location ? { location } : {}),
      });
      return response.data!;
    } catch (error) {
      logger.error('[AuthService] Register failed', error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const location = await resolveBrowserCountryLocation();
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password,
        ...(location ? { location } : {}),
      });
      return response.data!;
    } catch (error) {
      logger.error('[AuthService] Login failed', error);
      throw error;
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
      return response.data!;
    } catch (error) {
      logger.error('[AuthService] Get profile failed', error);
      throw error;
    }
  },

  async updateProfile(data: { name?: string; avatar?: string }): Promise<User> {
    logger.debug('[AuthService] Updating profile');
    try {
      const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
      logger.debug('[AuthService] Profile updated successfully');
      return response.data!;
    } catch (error) {
      logger.error('[AuthService] Profile update failed', error);
      throw error;
    }
  },

  async changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    logger.debug('[AuthService] Changing password');
    try {
      await apiClient.post<ApiResponse<void>>('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      logger.debug('[AuthService] Password changed successfully');
    } catch (error) {
      logger.error('[AuthService] Change password failed', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    logger.debug('[AuthService] Logging out');
    try {
      await apiClient.post<ApiResponse<void>>('/auth/logout', {});
      logger.debug('[AuthService] Logged out successfully');
    } catch (error) {
      logger.error('[AuthService] Logout failed', error);
      throw error;
    }
  },
};

export default authService;

