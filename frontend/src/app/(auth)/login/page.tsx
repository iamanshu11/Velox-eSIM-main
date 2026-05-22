"use client";

import Button from "@/components/Button";
import Container from "@/components/Container";
import Input from "@/components/Input";
import { apiClient } from "@/lib/apiClient";
import { setUser } from "@/store/slices/authSlice";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import logger from "@/lib/logger";
import { resolveBrowserCountryLocation } from "@/lib/browserCountryLocation";
import { validateEmail } from "@/utils/validators";
import { FormError } from "@/utils/formValidation";
import type { ApiResponse, User } from "@/types";

function LoginContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);
  const registered = searchParams.get("registered") === "true";
  const fromPath = searchParams.get("from") || searchParams.get("redirect");
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION_MS = 15 * 60 * 1000;

  useEffect(() => {
    if (isAuthenticated && redirectTarget) {
      router.push(redirectTarget);
    }
  }, [isAuthenticated, redirectTarget, router]);
  useEffect(() => {
    if (!blockUntil || new Date() >= blockUntil) {
      return;
    }
    
    const timer = setInterval(() => {
      if (new Date() >= blockUntil) {
        setBlockUntil(null);
        setFailedAttempts(0);
        setError("");
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [blockUntil]);

  const isRateLimited = !!blockUntil && new Date() < blockUntil;
  const remainingMinutes = Math.ceil(
    ((blockUntil?.getTime() || 0) - new Date().getTime()) / 60000
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    if (isRateLimited) {
      setError(
        `Too many login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`
      );
      return;
    }

    setLoading(true);

    const errors: Record<string, string> = {};
    if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const location = await resolveBrowserCountryLocation();
      const response = await apiClient.post<ApiResponse<{ user: User }>>("/auth/login", {
        email,
        password,
        ...(location ? { location } : {}),
      });

      if (response?.success && response?.data?.user) {
        const user = response.data.user;

        if (!user) {
          setError("Login failed: No user data received.");
          logger.error("Login failed: No user data received");
          return;
        }

        setFailedAttempts(0);
        setBlockUntil(null);
        const isAdmin = user?.role === "ADMIN";
        const redirectPath = isAdmin
          ? "/admin"
          : fromPath || "/dashboard";

        setRedirectTarget(redirectPath);
        dispatch(setUser(user));
        logger.info(`User ${email} logged in successfully`);
      } else {
        setError(
          response?.message || "Login failed: Invalid response from server.",
        );
        logger.error("Login failed: Invalid response", response);
      }
    } catch (err) {
      let errorMsg = "Login failed. Please try again.";
      let statusCode = 0;
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const error = err as any;
        statusCode = error?.response?.status;
        if (statusCode === 429) {
          errorMsg = "Too many login attempts. Please try again in 15 minutes.";
          setFailedAttempts(MAX_ATTEMPTS);
          setBlockUntil(new Date(Date.now() + BLOCK_DURATION_MS));
        } else {
          errorMsg = 
            error?.response?.data?.error?.message || 
            error?.response?.data?.message ||       
            error?.message ||                       
            error?.statusText ||                    
            "Login failed. Please try again.";
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          
          if (newFailedAttempts >= MAX_ATTEMPTS) {
            setBlockUntil(new Date(Date.now() + BLOCK_DURATION_MS));
          }
        }
      }
      
      setError(errorMsg);
      const errorDescription = err instanceof Error 
        ? err.message 
        : (typeof err === 'object' && err !== null
          ? (() => {
              const error = err as any;
              return `${error?.response?.status || 'Unknown'}: ${error?.response?.data?.message || error?.message || JSON.stringify(error)}`;
            })()
          : String(err));
      
      const loginLogMessage = [
        errorMsg,
        statusCode ? `(status ${statusCode})` : null,
        errorDescription ? `- ${errorDescription}` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const isExpectedLoginFailure =
        statusCode === 401 ||
        statusCode === 403 ||
        statusCode === 429 ||
        errorMsg.toLowerCase().includes("disabled") ||
        errorMsg.toLowerCase().includes("invalid credentials");

      if (isExpectedLoginFailure) {
        logger.warn("[Login] Warning:", loginLogMessage);
      } else {
        logger.error("[Login] Error:", loginLogMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-20">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="hidden md:block">
            <h1 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
              Welcome Back
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Sign in to your account and access your eSIM plans, settings, and
              support.
            </p>
            <ul className="space-y-4">
              {[
                "Manage your active eSIMs",
                "View purchase history",
                "Access customer support",
                "Update profile settings",
              ].map((feature, idx) => (
                <li key={feature || idx} className="flex items-start gap-3">
                  <span className="text-xl text-gray-900 mt-1 font-bold">
                    /
                  </span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Sign In
              </h2>
              <p className="text-gray-700">Access your Velox eSIM account</p>
            </div>

            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-8">
              {registered && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  Account created successfully! Please sign in with your
                  credentials.
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={`w-full ${validationErrors.email ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.email && <FormError message={validationErrors.email} className="mt-2" />}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full ${validationErrors.password ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.password && <FormError message={validationErrors.password} className="mt-2" />}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Remember me
                    </span>
                  </label>
                  <Link
                    href="/contact"
                    className="text-sm text-gray-900 hover:text-gray-700 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || isRateLimited}
                >
                  {loading ? "Signing in..." : isRateLimited ? `Blocked for ${remainingMinutes}m` : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-700 text-sm">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-gray-900 hover:text-gray-700 font-semibold transition-colors"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-center mt-6 text-sm text-gray-600">
              By signing in, you agree to our{" "}
              <Link
                href="/terms"
                className="text-gray-900 hover:text-gray-700 font-semibold transition-colors"
              >
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
