'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/Button';
import Container from '@/components/Container';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Container>
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We encountered an error while processing your request. Please try again.
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
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button
                variant="secondary"
                className="w-full"
                icon={<Home className="w-4 h-4" />}
              >
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
