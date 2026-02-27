"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter, Highlight, ReaderTheme } from "@/types";
import { useVirtualPaginator } from "@/hooks/useVirtualPaginator";
import { useHighlightRenderer } from "@/hooks/useHighlightRenderer";
import { HtmlContentRenderer } from "./HtmlContentRenderer";
import { HighlightPopover } from "./HighlightPopover";
import { SwipeHandler } from "./SwipeHandler";

interface ReaderContentProps {
  chapter: Chapter;
  highlights: Highlight[];
  theme: ReaderTheme;
  fontSize: number;
  lineHeight: number;
  onPageChange: (page: number, total: number) => void;
  onHighlightCreate: (input: {
    chapter_id: string;
    selected_text: string;
    prefix_context?: string;
    suffix_context?: string;
    note?: string;
    color: string;
  }) => void;
  /** Controlled page — pass to jump to a specific page */
  targetPage?: number;
}

export function ReaderContent({
  chapter,
  highlights,
  theme,
  fontSize,
  lineHeight,
  onPageChange,
  onHighlightCreate,
  targetPage,
}: ReaderContentProps) {
  const { containerRef, currentPage, totalPages, goToPage, nextPage, prevPage } =
    useVirtualPaginator({ columnGap: 0 });

  const { applyHighlights, captureSelection } = useHighlightRenderer();

  // Popover state
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const pendingSelectionRef = useRef<{
    selected_text: string;
    prefix_context: string;
    suffix_context: string;
  } | null>(null);

  // Notify parent when page/total changes
  useEffect(() => {
    onPageChange(currentPage, totalPages);
  }, [currentPage, totalPages, onPageChange]);

  // Jump to target page when it changes externally
  useEffect(() => {
    if (targetPage !== undefined && targetPage !== currentPage) {
      goToPage(targetPage);
    }
    // intentionally exclude currentPage to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPage, goToPage]);

  // Apply highlights whenever chapter or highlights list changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    applyHighlights(el, highlights, chapter.id);
  }, [chapter.id, highlights, applyHighlights, containerRef]);

  // Text selection handler
  const handleMouseUp = useCallback(() => {
    const capture = captureSelection();
    if (!capture) {
      setPopoverPos(null);
      pendingSelectionRef.current = null;
      return;
    }

    const { selected_text, prefix_context, suffix_context, range } = capture;
    pendingSelectionRef.current = { selected_text, prefix_context, suffix_context };

    const rect = range.getBoundingClientRect();
    setPopoverPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, [captureSelection]);

  const handleHighlightSave = useCallback(
    (color: string, note: string) => {
      if (!pendingSelectionRef.current) return;
      onHighlightCreate({
        chapter_id: chapter.id,
        ...pendingSelectionRef.current,
        color,
        note: note || undefined,
      });
      pendingSelectionRef.current = null;
      setPopoverPos(null);
      window.getSelection()?.removeAllRanges();
    },
    [chapter.id, onHighlightCreate]
  );

  const handleHighlightCancel = useCallback(() => {
    pendingSelectionRef.current = null;
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden">
      <SwipeHandler
        onNext={nextPage}
        onPrev={prevPage}
        className="h-full"
      >
        {/*
          The outer div clips the viewport to one page.
          The inner ref'd div is the multi-column scroll container —
          its scrollLeft is driven by useVirtualPaginator.
        */}
        <div className="h-full overflow-hidden">
          <div
            ref={containerRef}
            className="h-full overflow-x-auto"
            style={{
              columnCount: 1,
              columnFill: "auto",
              columnGap: 0,
              // Hide scroll bar
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            } as React.CSSProperties}
            onMouseUp={handleMouseUp}
          >
            <HtmlContentRenderer
              html={chapter.content_html}
              theme={theme}
              fontSize={fontSize}
              lineHeight={lineHeight}
              className="px-8 py-6 max-w-none"
            />
          </div>
        </div>
      </SwipeHandler>

      {/* Highlight creation popover */}
      <HighlightPopover
        position={popoverPos}
        onSave={handleHighlightSave}
        onCancel={handleHighlightCancel}
      />
    </div>
  );
}
