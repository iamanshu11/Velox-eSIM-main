'use client';

import { Bell, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { apiClient } from '@/lib/apiClient';
import { apiSlice } from '@/store/slices/apiSlice';
import WalletBalance from '@/components/WalletBalance';
import SearchBar from '@/components/SearchBar';
import Image from 'next/image';

export default function DashboardHeader() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (!showUserMenu) {
      return;
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await apiClient.post<any>("/auth/logout", {});
      dispatch(apiSlice.util.invalidateTags(['Wallet', 'Orders', 'eSIM', 'Analytics', 'Settings', 'Webhooks', 'Uploads', 'AutoRenewal', 'Billing', 'Referral', 'Auth']));
      dispatch(logoutAction());
      router.push('/login');
    } catch (error) {
      dispatch(apiSlice.util.invalidateTags(['Wallet', 'Orders', 'eSIM', 'Analytics', 'Settings', 'Webhooks', 'Uploads', 'AutoRenewal', 'Billing', 'Referral', 'Auth']));
      dispatch(logoutAction());
      router.push('/login');
    }
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 right-0 left-0 lg:left-72 z-40 bg-neutral-50 border-b border-gray-200 py-3"
    >
      <div className="h-full px-6 flex items-center justify-between gap-3">
        {/* Logo on mobile - spacer */}
        <div className="hidden lg:block w-0" />

        {/* Search Bar - Full Width */}
        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>

        {/* Right Side - Balance, Notifications & User Menu */}
        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 relative z-50">
          {/* Wallet Balance - Compact */}
          <div className="hidden lg:block">
            <WalletBalance variant="compact" showTopUpButton={false} />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="group relative p-1 rounded-full transition-all duration-200 cursor-pointer hover:bg-gray-100/50"
            >
              {user?.avatar ? (
                <Image
                  width={40}
                  height={40}
                  src={user.avatar}
                  alt={user?.name || 'User avatar'}
                  className="rounded-full object-cover shadow-lg ring-2 ring-primary-300 group-hover:ring-primary-400 transition-all"
                />
              ) : (
                <div className="w-12 h-12 bg-linear-to-br from-primary-500 via-primary-600 to-primary-800 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-primary-300 group-hover:ring-primary-400 transition-all">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </motion.button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
              >
                {/* User Info Header */}
                <div className="px-4 py-4 bg-linear-to-r from-primary-50 to-primary-100/50 border-b border-primary-100">
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <Image
                        width={40}
                        height={40}
                        src={user.avatar}
                        alt={user?.name || 'User avatar'}
                        className="rounded-full object-cover ring-2 ring-primary-300"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <Link href="/dashboard/profile">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 text-sm">
                    <User className="w-4 h-4 text-primary-600" />
                    <span>Profile Settings</span>
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
