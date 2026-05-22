'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { authManager } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const AdminHeader: React.FC = () => {
  const router = useRouter();
  const user = authManager.getUser();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    authManager.logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-primary-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </motion.button>

        {/* User Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-700" />
            </div>
            <div className="hidden sm:block text-sm">
              <p className="font-semibold text-gray-900">Admin</p>
              <p className="text-gray-600 text-xs">{user?.email || 'admin@esim.com'}</p>
            </div>
          </motion.button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
              >
                <Link href="/admin/profile" className="w-full block">
                  <button className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                </Link>
                <Link href="/admin/settings" className="w-full block">
                  <button className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <Settings className="w-4 h-4" />
                    <span>Admin Settings</span>
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

