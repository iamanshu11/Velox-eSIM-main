'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import Button from '@/components/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-16 h-16 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-6">
          An error occurred during authentication. Please try again or log in.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-primary-700 hover:text-primary-900 underline"
            >
              {showDetails ? 'Hide' : 'Show'} Error Details
            </button>
            {showDetails && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <p className="text-xs font-mono text-red-700 break-all">
                  {error.message}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={reset}
            variant="primary"
            className="flex-1"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Retry
          </Button>
          <Link href="/auth/login" className="flex-1">
            <Button
              variant="secondary"
              className="w-full"
              icon={<LogIn className="w-4 h-4" />}
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
