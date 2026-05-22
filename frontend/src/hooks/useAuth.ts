'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { setUser, logout as logoutAction, setError, clearError } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { BackendApiResponse } from '@/types/api';
import type { User } from '@/types';
import { resolveBrowserCountryLocation } from '@/lib/browserCountryLocation';

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(setError(null));
        const location = await resolveBrowserCountryLocation();
        const response = await apiClient.post<BackendApiResponse<{ user: User }>>('/auth/login', {
          email,
          password,
          ...(location ? { location } : {}),
        });

        if (response?.success && response?.data?.user) {
          dispatch(setUser(response.data.user));
          return response.data;
        } else {
          throw new Error(response?.message || 'Login failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        dispatch(setError(errorMessage));
        throw err;
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (data: { email: string; password: string; phone?: string }) => {
      try {
        dispatch(setError(null));
        const location = await resolveBrowserCountryLocation();
        const response = await apiClient.post<BackendApiResponse<{ user: User }>>('/auth/register', {
          ...data,
          ...(location ? { location } : {}),
        });

        if (response?.success && response?.data?.user) {
          dispatch(setUser(response.data.user));
          return response.data;
        } else {
          throw new Error(response?.message || 'Registration failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        dispatch(setError(errorMessage));
        throw err;
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      dispatch(setError(null));
      await apiClient.post<BackendApiResponse<void>>('/auth/logout', {});
      dispatch(logoutAction());
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(logoutAction());
      router.push('/login');
    }
  }, [dispatch, router]);

  const logoutAll = useCallback(async () => {
    try {
      dispatch(setError(null));
      await apiClient.post<BackendApiResponse<void>>('/auth/logout-all', {});
      dispatch(logoutAction());
      router.push('/login');
    } catch (err) {
      console.error('Logout all error:', err);
      dispatch(logoutAction());
      router.push('/login');
    }
  }, [dispatch, router]);

  const updateProfile = useCallback(
    async (data: { name?: string; avatar?: string }) => {
      try {
        dispatch(setError(null));
        const response = await apiClient.put<BackendApiResponse<User>>('/auth/profile', data);

        if (response?.success && response?.data) {
          dispatch(setUser(response.data));
          return response.data;
        } else {
          throw new Error(response?.message || 'Update failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
        dispatch(setError(errorMessage));
        throw err;
      }
    },
    [dispatch]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        dispatch(setError(null));
        const response = await apiClient.post<BackendApiResponse<void>>('/auth/change-password', {
          currentPassword,
          newPassword,
        });

        if (response?.success) {
          return response;
        } else {
          throw new Error(response?.message || 'Password change failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Password change failed';
        dispatch(setError(errorMessage));
        throw err;
      }
    },
    [dispatch]
  );

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    logoutAll,
    updateProfile,
    changePassword,
    clearError: () => dispatch(clearError()),
  };
};

export default useAuth;
