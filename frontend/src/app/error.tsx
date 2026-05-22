'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';

interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    logger.error('Application error caught by boundary', error);
  }, [error]);

  const isAuthError = error.message?.includes('auth') || error.message?.includes('unauthorized');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isAuthError ? 'Authentication Error' : 'Something went wrong'}
          </h1>
          <p className="text-slate-600 text-sm mb-4">
            {isAuthError
              ? 'Your session has expired or you do not have permission to access this page.'
              : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-slate-100 rounded text-left text-xs max-h-24 overflow-auto">
              <p className="font-mono text-slate-700 wrap-break-word">
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isAuthError ? (
            <>
              <button
                onClick={() => {
                  document.cookie = 'accessToken=; max-age=0;';
                  document.cookie = 'refreshToken=; max-age=0;';
                  router.push('/login');
                }}
                className="w-full py-2 px-4 bg-primary-700 hover:bg-primary-800 text-white font-medium rounded transition"
              >
                Go to Login
              </button>
            </>
          ) : (
            <>
              <button
                onClick={reset}
                className="w-full py-2 px-4 bg-primary-700 hover:bg-primary-800 text-white font-medium rounded transition"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-2 px-4 bg-slate-300 hover:bg-slate-400 text-slate-900 font-medium rounded transition"
              >
                Go Home
              </button>
            </>
          )}

          <a
            href="mailto:support@veloxesim.com"
            className="block text-center text-slate-600 hover:text-primary-700 text-sm transition"
          >
            Contact Support
          </a>
        </div>

        {/* Error ID */}
        <div className="text-center text-xs text-slate-500">
          <p>Error ID: {Date.now()}</p>
        </div>
      </div>
    </div>
  );
}
