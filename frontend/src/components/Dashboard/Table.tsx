'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (currentPage <= 3) return i + 1
    if (currentPage > totalPages - 3) return totalPages - 4 + i
    return currentPage - 2 + i
  })

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
        >
          <ChevronLeft />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-gray-900 text-white'
                : 'hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilter?: (filters: Record<string, any>) => void
  filters?: Array<{ key: string; label: string; options: string[] }>
  placeholder?: string
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilter,
  filters = [],
  placeholder = 'Search...',
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onSearch(e.target.value)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilter?.(newFilters)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-lg bg-white p-4"
    >
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-gray-900 placeholder-slate-400 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-gray-700 font-medium transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-primary-500/20"
          >
            <Filter size={18} />
            Filters
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="text-sm font-semibold text-gray-900">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-gray-900 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    info: 'bg-neutral-100 text-gray-900 dark:bg-neutral-900 dark:text-neutral-100',
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {status}
    </motion.span>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mb-4 text-5xl text-gray-400 dark:text-gray-600">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mb-6 text-gray-600 dark:text-gray-400">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-gray-900 px-6 py-2 text-white transition-colors hover:bg-gray-800"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}

export { Pagination, SearchFilter, StatusBadge, EmptyState }
