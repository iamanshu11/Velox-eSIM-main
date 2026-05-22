import React from 'react';

interface SkeletonGridProps {
  items?: number;
  columns?: number;
}

export function SkeletonGrid({ items = 12, columns = 3 }: SkeletonGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white animate-pulse"
        >
          <div className="px-6 py-4 bg-gray-200 h-12"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="pt-4 flex gap-2">
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
