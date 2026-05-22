"use client";

import { apiClient } from "@/lib/apiClient";
import { RootState } from "@/store";
import { apiSlice } from "@/store/slices/apiSlice";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Button";
import WalletBalance from "./WalletBalance";

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredNavHref, setHoveredNavHref] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!userMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "eSIM Store", href: "/esim" },
    { label: "How it Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Magazine", href: "/magazine" },
    { label: "FAQ", href: "/faq" },
  ];

  const activeNavHref =
    navItems.find((item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))?.href || "/";
  const highlightedNavHref = hoveredNavHref || activeNavHref;
  const shellClass = "mx-auto w-full px-4 sm:px-5 lg:px-8 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
  const shellWidthClass = isScrolled
    ? "sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] lg:w-[calc(100%-8rem)]"
    : "w-full";

  return (
    <header className="fixed top-4 left-0 right-0 z-50">
      <div className={`${shellClass} ${shellWidthClass}`}>
        <div className={`relative flex items-center justify-between gap-3 rounded-full px-4 sm:px-5 lg:px-8 py-3 sm:py-4 transition-[background-color,box-shadow,backdrop-filter,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled
            ? "backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-white/45"
            : "bg-transparent backdrop-blur-0 shadow-none ring-0 ring-white/45"
        }`}>
          {/* Logo with Image */}
          <Link href="/" className="flex items-center shrink-0 group rounded-[1.15rem] px-3 py-2">
            <motion.div
              className="relative h-10 sm:h-11 overflow-hidden flex items-center justify-center transition-all duration-300"
              style={{ aspectRatio: "583/182" }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/images/logo.svg"
                alt="Velox eSIM"
                width={583}
                height={182}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </Link>

          {/* Auth Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance - Display on desktop and tablet */}
                <div className="hidden md:block">
                  <WalletBalance 
                    showTopUpButton={true} 
                    variant="compact"
                    className="bg-white/82 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                  />
                </div>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                {/* User Account Button */}
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="group relative p-1 rounded-full transition-all duration-200 hover:bg-white/30 cursor-pointer"
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
                    <div className="w-10 h-10 bg-linear-to-br from-primary-500 via-primary-600 to-primary-800 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-primary-300 group-hover:ring-primary-400 transition-all">
                      {user?.name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        'U'}
                    </div>
                  )}
                </motion.button>

                {/* User Menu Dropdown */}
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-xl border border-neutral-200 shadow-xl z-50 overflow-hidden"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-4 bg-linear-to-r from-primary-50 to-primary-100/50 border-b border-primary-100">
                      <div className="flex items-center gap-3">
                        {user?.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user?.name || 'User avatar'}
                            width={40}
                            height={40}
                            className="rounded-full object-cover ring-2 ring-primary-300"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user?.name?.[0]?.toUpperCase() ||
                              user?.email?.[0]?.toUpperCase() ||
                              'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link 
                      href={user?.role === "ADMIN" ? "/admin" : "/dashboard"} 
                      className="block"
                    >
                      <button
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 border-b border-gray-50 text-sm"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary-600" />
                        <span>Dashboard</span>
                      </button>
                    </Link>
                    <Link
                      href={user?.role === "ADMIN" ? "/admin/profile" : "/dashboard/profile"}
                      className="block"
                    >
                      <button
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 border-b border-gray-50 text-sm"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-primary-600" />
                        <span>Profile Settings</span>
                      </button>
                    </Link>
                    <button
                      onClick={async () => {
                        try {
                          setUserMenuOpen(false);
                          await apiClient.post<any>("/auth/logout", {});
                          
                          dispatch(apiSlice.util.invalidateTags(['Wallet', 'Orders', 'eSIM', 'Analytics', 'Settings', 'Webhooks', 'Uploads', 'AutoRenewal', 'Billing', 'Referral', 'Auth']));
                          
                          dispatch(logoutAction());
                          
                          router.push("/");
                        } catch (error) {
                          dispatch(apiSlice.util.invalidateTags(['Wallet', 'Orders', 'eSIM', 'Analytics', 'Settings', 'Webhooks', 'Uploads', 'AutoRenewal', 'Billing', 'Referral', 'Auth']));
                          dispatch(logoutAction());
                          router.push("/");
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-200 text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="transition-all duration-300 text-slate-700 bg-white/72 hover:bg-primary-800 hover:text-white"
                    >
                      Login
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/register">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      className="shadow-md hover:shadow-lg transition-all duration-300 bg-primary-700 hover:bg-primary-800"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-950 transition-colors duration-300"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: mobileMenuOpen ? 1 : 0,
            height: mobileMenuOpen ? "auto" : 0,
          }}
          transition={{ duration: 0.3 }}
          className="lg:hidden overflow-hidden rounded-b-3xl bg-neutral-50/95 border border-neutral-200/70 backdrop-blur-sm shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="px-4 py-6 space-y-3">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <motion.div key={item.href} whileHover={{ x: 4 }}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg transition-all duration-300 font-medium ${isActive
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-700 hover:text-slate-950 hover:bg-neutral-200"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
            {!isAuthenticated && (
              <Link href="/login" className="block">
                <Button
                  variant="outline"
                    className="w-full text-slate-700 bg-white/80 hover:text-white hover:bg-primary-900 transition-all duration-300"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-white/62 px-1 py-2 border border-neutral-200/50 backdrop-blur-md shadow-[0_10px_24px_rgba(15,23,42,0.05)] z-40">
        {navItems.map((item) => {
          const isHighlighted = highlightedNavHref === item.href;
          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                onMouseEnter={() => setHoveredNavHref(item.href)}
                onMouseLeave={() => setHoveredNavHref(null)}
                className={`relative px-3.5 py-2 rounded-full transition-all duration-200 font-semibold text-sm ${
                  isHighlighted ? "text-white!" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {isHighlighted && (
                  <motion.span
                    layoutId="header-nav-indicator"
                    className="absolute inset-0 rounded-full bg-primary-700 shadow-[0_10px_22px_rgba(67,161,240,0.28)]"
                    transition={{ type: "tween", ease: "easeOut", duration: 0.18 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;

