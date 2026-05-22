"use client";

import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, logout, setInitialized } from "@/store/slices/authSlice";
import { apiClient } from "@/lib/apiClient";
import { authManager } from "@/lib/auth";
import { RootState } from "@/store";
import logger from "@/lib/logger";
import { BackendApiResponse } from "@/types/api";
import { User, UserRole } from "@/types";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const isInitialized = useSelector(
    (state: RootState) => state.auth.isInitialized,
  );
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  useEffect(() => {
    if (isInitialized) {
      logger.debug('[AuthProvider] Already initialized, skipping auth check');
      return;
    }

    const jwtUser = authManager.getUser();
    if (jwtUser) {
      const userRole: UserRole = (['ADMIN', 'SUPER_ADMIN', 'CUSTOMER', 'RESELLER'].includes(jwtUser.role)
        ? jwtUser.role
        : 'CUSTOMER') as UserRole;
      
      const mappedUser: User = {
        id: jwtUser.userId,
        email: jwtUser.email,
        name: jwtUser.name || jwtUser.email.split('@')[0],
        role: userRole,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      dispatch(setUser(mappedUser));
    }
    if (isAuthenticated) {
      logger.debug('[AuthProvider] Already authenticated, marking as initialized');
      dispatch(setInitialized(true));
      return;
    }

    const initializeAuth = async () => {
      try {
        logger.debug('[AuthProvider] Initializing auth by checking /auth/profile');
        const response = await apiClient.get<BackendApiResponse<User>>("/auth/profile");

        if (response?.success && response?.data) {
          logger.info(
            "[AuthProvider] Auth initialized with user: " + response.data.email,
          );
          dispatch(setUser(response.data));
        } else {
          logger.debug('[AuthProvider] No valid profile, user is not authenticated');
          dispatch(logout());
          dispatch(setInitialized(true));
        }
      } catch (error) {
        const errorStatus = (error instanceof Error && 'status' in error) ? (error as any).status : undefined;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.debug(
          "[AuthProvider] Auth initialization failed: " + errorStatus + " " + errorMessage,
        );
        if (errorStatus === 401 || errorStatus === 403) {
          logger.debug('[AuthProvider] Auth token invalid, clearing state');
          dispatch(logout());
        }

        dispatch(setInitialized(true));
      }
    };

    initializeAuth();
  }, [isInitialized, isAuthenticated, dispatch]);

  return <>{children}</>;
}
