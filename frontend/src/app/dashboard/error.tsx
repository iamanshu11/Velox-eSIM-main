'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-950">Error</h1>
          <p className="text-gray-600 mt-2">Something went wrong in your dashboard</p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
            <p className="text-gray-600 mb-4">
              An error occurred while loading your dashboard. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-primary-700 hover:text-primary-900 underline"
                >
                  {showDetails ? 'Hide' : 'Show'} Error Details
                </button>
                {showDetails && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
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
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
              <Link href="/dashboard">
                <Button
                  variant="secondary"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                >
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
