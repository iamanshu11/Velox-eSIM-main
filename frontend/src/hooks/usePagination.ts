import { useState, useEffect, useMemo } from 'react';

interface UsePaginationReturn<T> {
  page: number;
  totalPages: number;
  paginatedData: T[];
  setPage: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 10
): UsePaginationReturn<T> {
  const [page, setPage] = useState(1);
  const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [totalPages, page]);
  const paginatedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, page, itemsPerPage]);

  return {
    page,
    totalPages,
    paginatedData,
    setPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
