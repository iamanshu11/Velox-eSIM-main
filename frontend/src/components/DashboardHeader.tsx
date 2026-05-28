'use client';

import { Bell, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { apiSlice } from '@/store/slices/apiSlice';
import { apiClient } from '@/lib/apiClient';
import WalletBalance from '@/components/WalletBalance';
import SearchBar from '@/components/SearchBar';

const AUTH_TAGS = [
  'Wallet', 'Orders', 'eSIM', 'Analytics', 'Settings',
  'Webhooks', 'Uploads', 'AutoRenewal', 'Billing', 'Referral', 'Auth',
] as const;

export default function DashboardHeader() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const user     = useSelector((state: RootState) => state.auth.user);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleLogout = useCallback(async () => {
    setShowMenu(false);
    try {
      await apiClient.post<unknown>('/auth/logout', {});
    } finally {
      dispatch(apiSlice.util.invalidateTags([...AUTH_TAGS]));
      dispatch(logoutAction());
      router.push('/login');
    }
  }, [dispatch, router]);

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 left-0 lg:left-72 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
    >
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between gap-4">

        {/* Search */}
        <div className="flex-1 min-w-0 max-w-lg">
          <SearchBar />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Wallet — desktop */}
          <div className="hidden lg:block">
            <WalletBalance variant="compact" showTopUpButton={false} />
          </div>

          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {/* Dot indicator */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Avatar / user menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              onClick={() => setShowMenu((v) => !v)}
              whileTap={{ scale: 0.94 }}
              aria-label="User menu"
              aria-expanded={showMenu}
              className="rounded-full ring-2 ring-transparent hover:ring-primary-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-primary-500"
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name ?? 'Avatar'}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center text-white font-bold text-sm">
                  {initial}
                </div>
              )}
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  key="dashboard-user-menu"
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl border border-neutral-200/80 shadow-[0_16px_48px_rgba(15,23,42,0.12)] z-50 overflow-hidden"
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-primary-50 to-primary-100/40 border-b border-primary-100/60">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name ?? 'Avatar'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {user?.name ?? 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <User className="w-4 h-4 text-primary-600 shrink-0" />
                      Profile Settings
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
