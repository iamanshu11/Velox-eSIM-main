"use client";

import { NAVIGATION_ITEMS } from "@/constants/navigation";
import { apiClient } from "@/lib/apiClient";
import { RootState } from "@/store";
import { apiSlice } from "@/store/slices/apiSlice";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { USER_ROLES } from "@/constants";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Button";
import WalletBalance from "./WalletBalance";

// ─── Shared logout tag list ────────────────────────────────────────────────────
const AUTH_TAGS = [
  "Wallet", "Orders", "eSIM", "Analytics", "Settings",
  "Webhooks", "Uploads", "AutoRenewal", "Billing", "Referral", "Auth",
] as const;

// ─── User avatar (shared between button and dropdown) ─────────────────────────
const UserAvatar = ({
  user,
  size = "md",
}: {
  user: { avatar?: string; name?: string; email?: string } | null;
  size?: "sm" | "md";
}) => {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const initial =
    user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  if (user?.avatar) {
    return (
      <Image
        src={user.avatar}
        alt={user.name ?? "User avatar"}
        width={size === "sm" ? 32 : 40}
        height={size === "sm" ? 32 : 40}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center text-white font-bold`}
    >
      {initial}
    </div>
  );
};

// ─── Main Header ──────────────────────────────────────────────────────────────
const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredHref, setHoveredHref]  = useState<string | null>(null);
  const [scrolled, setScrolled]       = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user            = useSelector((state: RootState) => state.auth.user);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  // Scroll detection — adds glass morphism pill
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    try {
      await apiClient.post<unknown>("/auth/logout", {});
    } finally {
      dispatch(apiSlice.util.invalidateTags([...AUTH_TAGS]));
      dispatch(logoutAction());
      router.push("/");
    }
  }, [dispatch, router]);

  // Derive active nav item — country slug pages and checkout count as /esim
  const normalizedPathname = (() => {
    if (pathname.startsWith('/checkout')) return '/esim';
    if (pathname.endsWith('-esim') && !NAVIGATION_ITEMS.some(i => i.href === pathname)) return '/esim';
    return pathname;
  })();

  const activeHref =
    NAVIGATION_ITEMS.find(
      (item) =>
        normalizedPathname === item.href ||
        (item.href !== "/" && normalizedPathname.startsWith(item.href))
    )?.href ?? "/";

  const highlightedHref = hoveredHref ?? activeHref;

  // ─── Pill wrapper dimensions based on scroll state ───────────────────────
  const outerClass = [
    "mx-auto w-full px-4 sm:px-6 lg:px-8",
    "transition-[padding,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
    scrolled
      ? "sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] lg:w-[calc(100%-8rem)]"
      : "w-full",
  ].join(" ");

  const pillClass = [
    "relative grid grid-cols-[auto_1fr_auto] items-center gap-4",
    "rounded-2xl px-4 sm:px-6 py-3",
    "transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
    scrolled
      ? "bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.06]"
      : "bg-white/0 backdrop-blur-none shadow-none ring-0",
  ].join(" ");

  return (
    <>
      {/* ── Fixed header bar ─────────────────────────────────────────────── */}
      <header className="fixed top-3 left-0 right-0 z-50">
        <div className={outerClass}>
          <div className={pillClass}>

            {/* Col 1 — Logo */}
            <Link
              href="/"
              className="flex items-center shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <motion.div
                className="relative h-9 sm:h-10 overflow-hidden"
                style={{ aspectRatio: "583/182" }}
                whileTap={{ scale: 0.96 }}
              >
                <Image
                  src="/images/logo.svg"
                  alt="Velox eSIM"
                  width={583}
                  height={182}
                  className="w-full h-full object-contain"
                  priority
                />
              </motion.div>
            </Link>

            {/* Col 2 — Desktop nav (centered in remaining space) */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex justify-center"
            >
              <ul className="flex items-center gap-0.5 rounded-full bg-black/[0.04] px-1 py-1 ring-1 ring-black/[0.06]">
                {NAVIGATION_ITEMS.map((item) => {
                  const active = highlightedHref === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onMouseEnter={() => setHoveredHref(item.href)}
                        onMouseLeave={() => setHoveredHref(null)}
                        className={[
                          "relative inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold",
                          "transition-colors duration-150 select-none",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                          active ? "" : "text-slate-600",
                        ].join(" ")}
                        style={{ color: active ? '#ffffff' : undefined }}
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-full bg-primary-700 shadow-[0_4px_14px_rgba(67,161,240,0.35)]"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span
                          className="relative z-10"
                          style={{ color: active ? '#ffffff' : undefined }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Col 3 — Auth / user controls */}
            <div className="flex items-center gap-2 sm:gap-3 justify-end">
              {isAuthenticated ? (
                <>
                  {/* Wallet — desktop only */}
                  <div className="hidden md:block">
                    <WalletBalance
                      showTopUpButton
                      variant="compact"
                      className="bg-white/80 shadow-[0_4px_12px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.06]"
                    />
                  </div>

                  {/* Avatar / user menu */}
                  <div className="relative" ref={menuRef}>
                    <motion.button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      whileTap={{ scale: 0.94 }}
                      aria-label="Open user menu"
                      aria-expanded={userMenuOpen}
                      className="rounded-full ring-2 ring-transparent hover:ring-primary-300 transition-all duration-200 focus-visible:outline-none focus-visible:ring-primary-500"
                    >
                      <UserAvatar user={user} />
                    </motion.button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          key="user-menu"
                          initial={{ opacity: 0, scale: 0.95, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -6 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl border border-neutral-200/80 shadow-[0_16px_48px_rgba(15,23,42,0.12)] z-50 overflow-hidden"
                        >
                          {/* User info strip */}
                          <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-primary-50 to-primary-100/40 border-b border-primary-100/60">
                            <UserAvatar user={user} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                {user?.name ?? "User"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-1">
                            <Link
                              href={user?.role === USER_ROLES.ADMIN ? "/admin" : "/dashboard"}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-primary-600 shrink-0" />
                              Dashboard
                            </Link>
                            <Link
                              href={
                                user?.role === USER_ROLES.ADMIN
                                  ? "/admin/profile"
                                  : "/dashboard/profile"
                              }
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              <Settings className="w-4 h-4 text-primary-600 shrink-0" />
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
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-700 bg-white/70 hover:bg-primary-700 hover:text-white hover:border-primary-700 transition-all duration-200"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="bg-primary-700 hover:bg-primary-800 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile menu toggle */}
              <motion.button
                onClick={() => setMobileOpen((v) => !v)}
                whileTap={{ scale: 0.93 }}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-black/[0.05] transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer (full-height slide-in) ─────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="lg:hidden fixed top-0 left-0 h-full w-72 z-50 bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
                <div
                  className="relative h-8 overflow-hidden"
                  style={{ aspectRatio: "583/182" }}
                >
                  <Image
                    src="/images/logo.svg"
                    alt="Velox eSIM"
                    width={140}
                    height={44}
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {NAVIGATION_ITEMS.map((item, i) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                    >
                      <Link
                        href={item.href}
                        className={[
                          "flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-primary-50 text-primary-700"
                            : "text-slate-700 hover:bg-gray-50 hover:text-slate-900",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Drawer footer */}
              <div className="px-3 py-4 border-t border-gray-100 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="mb-3">
                      <WalletBalance showTopUpButton variant="compact" />
                    </div>
                    <Link
                      href={user?.role === USER_ROLES.ADMIN ? "/admin" : "/dashboard"}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary-600" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full text-slate-700">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full bg-primary-700 hover:bg-primary-800">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
