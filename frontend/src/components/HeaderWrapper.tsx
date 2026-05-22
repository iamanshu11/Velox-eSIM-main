'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authManager } from '@/lib/auth';
import Header from './Header';
import { setUser } from '@/store/slices/authSlice';

interface HeaderWrapperProps {
  className?: string;
}

export default function HeaderWrapper({ className }: HeaderWrapperProps) {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state: any) => state.auth?.user);
  const isAuthenticated = useSelector((state: any) => state.auth?.isAuthenticated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    if (!isClient || isAuthenticated || reduxUser) {
      return;
    }

    try {
      const user = authManager.getUser();
      const hasValidToken = authManager.isAuthenticated();
      if (user && hasValidToken && !reduxUser) {
        let role: 'ADMIN' | 'CUSTOMER' = 'CUSTOMER';
        if (user.role === 'ADMIN') {
          role = 'ADMIN';
        }

        dispatch(setUser({
          id: user.userId,
          email: user.email,
          name: user.email?.split('@')[0] || '',
          role,
          avatar: undefined,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
    }
  }, [isClient, isAuthenticated, reduxUser, dispatch]);

  if (!isClient) {
    return <div className={`h-20 bg-white ${className}`} />;
  }

  return <Header />;
}
