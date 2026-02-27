"use client";

import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Highlighter,
  List,
  Settings,
} from "lucide-react";

interface ReaderToolbarProps {
  bookTitle: string;
  onBack: () => void;
  onSettingsOpen: () => void;
  onBookmarksOpen: () => void;
  onHighlightsOpen: () => void;
  onTOCOpen: () => void;
  className?: string;
}

export function ReaderToolbar({
  bookTitle,
  onBack,
  onSettingsOpen,
  onBookmarksOpen,
  onHighlightsOpen,
  onTOCOpen,
  className = "",
}: ReaderToolbarProps) {
  return (
    <header
      className={[
        "flex items-center justify-between px-4 py-2 border-b",
        "border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-900",
        className,
      ].join(" ")}
    >
      {/* Left: back button */}
      <button
        onClick={onBack}
        aria-label="Go back"
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Center: book title */}
      <div className="flex items-center gap-2 min-w-0">
        <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[160px] sm:max-w-xs">
          {bookTitle}
        </span>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={onTOCOpen}
          aria-label="Table of contents"
          title="Table of contents"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={onBookmarksOpen}
          aria-label="Bookmarks"
          title="Bookmarks"
        >
          <Bookmark className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={onHighlightsOpen}
          aria-label="Highlights"
          title="Highlights"
        >
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={onSettingsOpen}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </header>
  );
}

function ToolbarButton({
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}
