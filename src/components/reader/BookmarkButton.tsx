"use client";

import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
  className?: string;
}

export function BookmarkButton({
  isBookmarked,
  onToggle,
  className = "",
}: BookmarkButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      className={[
        "p-2 rounded-md transition-colors",
        isBookmarked
          ? "text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
        className,
      ].join(" ")}
    >
      <Bookmark
        className="w-5 h-5 transition-all"
        fill={isBookmarked ? "currentColor" : "none"}
      />
    </button>
  );
}
