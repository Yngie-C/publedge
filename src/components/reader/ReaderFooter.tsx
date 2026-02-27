"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReaderFooterProps {
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  className?: string;
}

export function ReaderFooter({
  chapterTitle,
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onNextChapter,
  onPrevChapter,
  className = "",
}: ReaderFooterProps) {
  return (
    <footer
      className={[
        "flex items-center justify-between px-4 py-2 border-t",
        "border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-900",
        className,
      ].join(" ")}
    >
      {/* Previous chapter */}
      <button
        onClick={onPrevChapter}
        disabled={!hasPrev}
        aria-label="Previous chapter"
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Chapter title + page info */}
      <div className="flex flex-col items-center min-w-0 px-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px] sm:max-w-sm">
          {chapterTitle}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          {currentPage} / {totalPages}
        </span>
      </div>

      {/* Next chapter */}
      <button
        onClick={onNextChapter}
        disabled={!hasNext}
        aria-label="Next chapter"
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </footer>
  );
}
