import { useCallback, useEffect, useRef, useState } from "react";

interface UseVirtualPaginatorOptions {
  /**
   * The gap (in px) between columns — must match the CSS `column-gap` value.
   */
  columnGap?: number;
}

interface UseVirtualPaginatorReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

/**
 * CSS multi-column based virtual paginator.
 *
 * The container element must have:
 *   column-count: 1
 *   column-fill: auto
 *   height: <fixed>          ← drives the pagination
 *   overflow: hidden
 *
 * This hook scrolls the container horizontally by translating it so
 * only the current "column" (= page) is visible.
 */
export function useVirtualPaginator(
  options: UseVirtualPaginatorOptions = {}
): UseVirtualPaginatorReturn {
  const { columnGap = 0 } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const containerWidth = el.clientWidth;
    const scrollWidth = el.scrollWidth;

    if (containerWidth === 0) {
      setTotalPages(1);
      return;
    }

    const pageWidth = containerWidth + columnGap;
    const pages = Math.max(1, Math.round(scrollWidth / pageWidth));
    setTotalPages(pages);
  }, [columnGap]);

  // Recalculate when content or container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    recalculate();

    const observer = new ResizeObserver(() => {
      recalculate();
      // Reset to page 1 on resize to avoid stale position
      setCurrentPage(1);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [recalculate]);

  // Apply the visual offset when currentPage changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const containerWidth = el.clientWidth;
    const offset = (currentPage - 1) * (containerWidth + columnGap);
    el.scrollLeft = offset;
  }, [currentPage, columnGap]);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  return { containerRef, currentPage, totalPages, goToPage, nextPage, prevPage };
}
