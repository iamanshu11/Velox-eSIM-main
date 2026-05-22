'use client';

import { motion } from 'framer-motion';
import {
    Home,
    LogOut,
    Menu,
    Smartphone,
    ShoppingCart,
    LifeBuoy,
    Settings,
    X,
    Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { authManager } from '@/lib/auth';

const DashboardSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My eSIMs', href: '/dashboard/esims', icon: Smartphone },
    { name: 'Wallet & Billing', href: '/dashboard/billing', icon: Wallet },
    { name: 'Browse Plans', href: '/plans', icon: ShoppingCart },
    { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    authManager.logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-black text-lg">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-black">E</span>
          </div>
          <span>eSim</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {isMobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isMobileOpen ? 0 : '-100%' }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30 lg:static lg:translate-x-0 flex flex-col overflow-y-auto pt-24 lg:pt-0 shadow-lg lg:shadow-none"
      >
        {/* Logo - Desktop Only */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-6 border-b border-gray-100 bg-primary-50">
          <div className="w-10 h-10 bg-linear-to-br from-primary-900 to-primary-700 rounded-lg flex items-center justify-center text-white font-black text-lg">
            E
          </div>
          <div className="flex-1">
            <p className="font-black text-lg text-gray-900">eSIM</p>
            <p className="text-xs text-gray-500">Control Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer relative group ${
                    active
                      ? 'bg-linear-to-r from-primary-50 to-primary-100 text-primary-700 font-semibold border-l-2 border-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-linear-to-b from-primary-900 to-primary-700 rounded-r-full"
                    />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary-700' : 'text-gray-600 group-hover:text-gray-700'}`} />
                  <span className="flex-1 text-sm font-medium">{item.name}</span>
                  {active && (
                    <motion.div
                      layoutId="activeDot"
                      className="w-2 h-2 bg-primary-700 rounded-full"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-6 border-t border-gray-100 bg-gray-50 space-y-3">
          <p className="text-xs font-semibold text-gray-600 px-2">Actions</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
};

export default DashboardSidebar;
