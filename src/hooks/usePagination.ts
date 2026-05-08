import { useState } from "react";
import { getSavedPage } from "@/hooks/useListHighlight";

const PAGE_SIZE = 20;

export function usePagination(listKey?: string) {
  const [page, setPage] = useState(() => (listKey ? getSavedPage(listKey) : 0));

  return {
    page,
    pageSize: PAGE_SIZE,
    from: page * PAGE_SIZE,
    to: (page + 1) * PAGE_SIZE - 1,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(0, p - 1)),
    resetPage: () => setPage(0),
    setPage,
  };
}
