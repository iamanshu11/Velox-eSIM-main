import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}
export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={!hasPrevPage}
        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-sm"
        aria-label="Previous page"
      >
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={page === p ? 'page' : undefined}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              page === p
                ? 'bg-primary-700 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={!hasNextPage}
        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-sm"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
