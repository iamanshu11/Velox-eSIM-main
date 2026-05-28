'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authManager } from '@/lib/auth';
import { RootState } from '@/store';
import Header from './Header';
import { setUser } from '@/store/slices/authSlice';

interface HeaderWrapperProps {
  className?: string;
}

export default function HeaderWrapper({ className }: HeaderWrapperProps) {
  const dispatch        = useDispatch();
  const reduxUser       = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Rehydrate Redux auth state from persisted token on first client render
  useEffect(() => {
    if (!isClient || isAuthenticated || reduxUser) return;

    try {
      const user         = authManager.getUser();
      const hasValidToken = authManager.isAuthenticated();

      if (user && hasValidToken) {
        dispatch(
          setUser({
            id:            user.userId,
            email:         user.email,
            name:          user.email?.split('@')[0] ?? '',
            role:          user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
            avatar:        undefined,
            emailVerified: true,
            createdAt:     new Date().toISOString(),
          }),
        );
      }
    } catch {
      // Token unreadable — leave unauthenticated
    }
  }, [isClient, isAuthenticated, reduxUser, dispatch]);

  // SSR skeleton — matches header's fixed top-3 + ~52px pill height = ~68px clearance
  if (!isClient) {
    return (
      <div
        aria-hidden="true"
        className={`h-[72px] pointer-events-none ${className ?? ''}`}
      />
    );
  }

  return <Header />;
}
