'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    
    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-neutral-300 bg-white p-2 transition-all duration-300 hover:border-primary-200 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4 text-secondary-900" />
      </motion.button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, idx) => (
          <motion.button
            key={`page-${page}-${idx}`}
            whileHover={{ scale: page !== '...' ? 1.05 : 1 }}
            whileTap={{ scale: page !== '...' ? 0.95 : 1 }}
            onClick={() => page !== '...' && onPageChange(page as number)}
            disabled={page === '...'}
            className={`
              min-w-10 h-10 rounded-lg font-medium transition-all duration-300
              ${
                page === currentPage
                  ? 'bg-primary-700 text-white shadow-md'
                  : page === '...'
                    ? 'cursor-default text-secondary-400'
                    : 'border border-neutral-300 bg-white text-secondary-900 hover:border-primary-200 hover:bg-neutral-50'
              }
            `}
          >
            {page}
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg border border-neutral-300 bg-white p-2 transition-all duration-300 hover:border-primary-200 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4 text-secondary-900" />
      </motion.button>

      <span className="ml-4 text-sm text-secondary-700">
        Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
      </span>
    </div>
  );
}

export default Pagination;
