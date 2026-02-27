"use client";

import * as Popover from "@radix-ui/react-popover";
import { Highlighter, Trash2, X } from "lucide-react";
import type { Highlight, Chapter } from "@/types";

const COLOR_SWATCH: Record<string, string> = {
  yellow: "bg-yellow-300",
  green: "bg-green-300",
  blue: "bg-blue-300",
  pink: "bg-pink-300",
};

interface HighlightListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlights: Highlight[];
  chapters: Chapter[];
  onNavigate: (chapterId: string) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}

export function HighlightList({
  open,
  onOpenChange,
  highlights,
  chapters,
  onNavigate,
  onDelete,
  children,
}: HighlightListProps) {
  const getChapterTitle = (chapterId: string) =>
    chapters.find((c) => c.id === chapterId)?.title ?? "Unknown chapter";

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Highlighter className="w-4 h-4 text-indigo-500" />
              Highlights
            </h3>
            <Popover.Close asChild>
              <button
                aria-label="Close highlights"
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Popover.Close>
          </div>

          {highlights.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
              No highlights yet
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {highlights.map((highlight) => (
                <li
                  key={highlight.id}
                  className="group flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Color swatch */}
                  <span
                    className={[
                      "mt-1 w-2.5 h-2.5 rounded-full shrink-0",
                      COLOR_SWATCH[highlight.color] ?? "bg-yellow-300",
                    ].join(" ")}
                  />

                  <button
                    onClick={() => {
                      onNavigate(highlight.chapter_id);
                      onOpenChange(false);
                    }}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {getChapterTitle(highlight.chapter_id)}
                    </p>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                      &ldquo;{highlight.selected_text}&rdquo;
                    </p>
                    {highlight.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic truncate">
                        {highlight.note}
                      </p>
                    )}
                  </button>

                  <button
                    onClick={() => onDelete(highlight.id)}
                    aria-label="Delete highlight"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Popover.Arrow className="fill-white dark:fill-gray-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
