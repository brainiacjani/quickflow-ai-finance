import { useEffect, useState } from 'react';

export default function useClientPagination<T>(items: T[] | null | undefined, pageSize = 10) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    // reset to first page when items or pageSize change
    setCurrentPage(1);
  }, [items, pageSize]);

  const totalItems = (items?.length ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedItems = items ? items.slice(start, start + pageSize) : ([] as T[]);

  const setPage = (p: number) => {
    const np = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(np);
  };

  return {
    currentPage: safePage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    setPage,
    next: () => setPage(safePage + 1),
    prev: () => setPage(safePage - 1),
    reset: () => setPage(1),
  } as const;
}
