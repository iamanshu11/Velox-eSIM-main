'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import logger from '@/lib/logger';
import Button from './Button';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error) => void;
  level?: 'page' | 'section' | 'inline';
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}
export default function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
  level = 'section',
}: ErrorBoundaryWrapperProps) {
  const [state, setState] = useState<ErrorState>({ hasError: false, error: null });

  const reset = () => {
    setState({ hasError: false, error: null });
  };

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      setState({ hasError: true, error });
      logger.error(`Error in ${level} boundary`, error);
      onError?.(error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      setState({ hasError: true, error });
      logger.error(`Unhandled rejection in ${level} boundary`, error);
      onError?.(error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [level, onError]);

  if (state.hasError && state.error) {
    if (fallback) {
      return fallback(state.error, reset);
    }
    if (level === 'inline') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-600">Something went wrong</p>
          <button
            onClick={reset}
            className="ml-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    if (level === 'section') {
      return (
        <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="shrink-0 pt-0.5">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">Something went wrong</h3>
              <p className="text-sm text-red-700 mb-4">
                {state.error.message || 'An unexpected error occurred. Please try again.'}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={reset}
                  className="bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-linear-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-600 mb-6">
              {state.error.message || 'An unexpected error occurred. Our team has been notified.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={reset}
                className="bg-primary-700 hover:bg-primary-800 text-white inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
