"use client";

import DashboardHeader from "@/components/DashboardHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { apiClient } from "@/lib/apiClient";
import { RootState } from "@/store";
import { logout as logoutAction } from "@/store/slices/authSlice";
import type { ApiResponse } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  CreditCard,
  Home,
  LogOut,
  Menu,
  MessageSquareIcon,
  Settings,
  Smartphone,
  Wallet,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const initials = user?.email?.[0].toUpperCase() || "U";
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard", exact: true },
    { icon: Smartphone, label: "My eSIMs", href: "/dashboard/esims" },
    { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
    { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
    { icon: MessageSquareIcon, label: "Support", href: "/dashboard/support" },
    { icon: Settings, label: "Profile", href: "/dashboard/profile" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post<ApiResponse<any>>("/auth/logout", {});
      dispatch(logoutAction());
      router.push("/");
    } catch (error) {
      router.push("/");
    }
  };

  const handleDropdownClick = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-neutral-200 bg-neutral-50">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={() => onClose?.()}
        >
          <div
            className="relative h-12 w-auto overflow-hidden flex items-center justify-center transition-all duration-300"
            style={{ aspectRatio: "583/182" }}
          >
            <Image
              src="/images/logo.svg"
              alt="Velox eSIM"
              width={583}
              height={182}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group relative ${active
                    ? "bg-primary-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-900 rounded-r-lg"
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
                  />
                  <span className="font-medium text-sm flex-1">
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Menu */}
      {user && (
        <div className="px-4 py-6 border-t border-neutral-200 bg-neutral-50 relative">
          <motion.button
            onClick={handleDropdownClick}
            className="w-full flex items-center gap-3 px-3 py-2 shadow-sm rounded-full border border-neutral-200 bg-white hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
          >
            {user.avatar ? (
              <Image
              width={40}
              height={40}
                src={user.avatar}
                alt={user?.name || 'User avatar'}
                className="rounded-full object-cover shadow-sm shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-900 to-primary-700 flex items-center justify-center font-bold text-white text-sm shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.email}
              </p>
            </div>
            <ChevronUp
              className={`w-5 h-5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-24 left-4 right-4 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden"
              >
                <Link
                  href="/"
                  onClick={() => {
                    setDropdownOpen(false);
                    onClose?.();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-neutral-200 text-sm font-medium"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Home</span>
                </Link>
                <motion.button
                  onClick={() => {
                    handleLogout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <ProtectedRoute type="protected">
      <div className="flex h-screen bg-neutral-50 overflow-hidden">
        {/* Desktop Sidebar */}
        {isMounted && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-neutral-200 shrink-0 shadow-sm"
          >
            <SidebarContent />
          </motion.div>
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-40"
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-neutral-200 z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between sticky top-0 bg-white border-b border-neutral-200 px-4 py-4 z-10">
                <h2 className="font-black text-gray-900">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Header with Wallet */}
          <div className="hidden lg:block">
            <DashboardHeader />
          </div>

          {/* Mobile Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="lg:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between shrink-0"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-900" />
            </motion.button>
            <h1 className="font-black text-gray-900 text-lg">
              My Dashboard
            </h1>
            <div className="w-10" />
          </motion.header>

          {/* Page Content */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-auto pt-20 lg:pt-24"
          >
            <div className="lg:px-8 lg:py-8 px-4 py-6 bg-primary-50 min-h-full">
              <div className="max-w-7xl mx-auto">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </div>
            </div>
          </motion.main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
