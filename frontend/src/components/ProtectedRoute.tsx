"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import logger from "@/lib/logger";
import Loader from "./Loader";

export type RouteType = "public" | "auth" | "protected" | "admin";

interface ProtectedRouteProps {
  children: ReactNode;
  type: RouteType;
}

export function ProtectedRoute({ children, type }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  );
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isInitialized) return;

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

    logger.debug(
      `[ProtectedRoute] ${type} route ${pathname} - User: ${user?.email || "none"} - IsAdmin: ${isAdmin}`,
    );

    let targetPath: string | null = null;

    switch (type) {
      case "public":
        setRedirecting(false);
        break;

      case "auth":
        if (isAuthenticated && user) {
          logger.debug(
            "[ProtectedRoute] User already authenticated, redirecting from auth route",
          );
          targetPath = isAdmin ? "/admin" : "/dashboard";
        } else {
          setRedirecting(false);
        }
        break;

      case "protected":
        if (!isAuthenticated || !user) {
          logger.debug(
            "[ProtectedRoute] Unauthenticated access attempt, redirecting to login",
          );
          targetPath = `/login?from=${pathname}`;
        } else if (isAdmin && pathname.startsWith("/dashboard")) {
          logger.debug(
            "[ProtectedRoute] Admin access to dashboard route, redirecting to admin",
          );
          targetPath = "/admin";
        } else {
          setRedirecting(false);
        }
        break;

      case "admin":
        if (!isAuthenticated || !user) {
          logger.debug(
            "[ProtectedRoute] Unauthenticated access to admin, redirecting to login",
          );
          targetPath = `/login?from=${pathname}`;
        } else if (!isAdmin) {
          logger.debug(
            "[ProtectedRoute] Non-admin user accessing admin route, redirecting to dashboard",
          );
          targetPath = "/dashboard";
        } else {
          setRedirecting(false);
        }
        break;
    }

    if (targetPath) {
      setRedirecting(true);
      router.replace(targetPath);
    }
  }, [type, pathname, router, mounted, user, isAuthenticated, isInitialized]);

  if (!mounted || !isInitialized || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}
