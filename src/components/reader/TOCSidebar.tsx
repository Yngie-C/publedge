"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, X } from "lucide-react";
import type { Chapter } from "@/types";

interface TOCSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapters: Chapter[];
  currentChapterId: string;
  onChapterSelect: (chapter: Chapter) => void;
}

export function TOCSidebar({
  open,
  onOpenChange,
  chapters,
  currentChapterId,
  onChapterSelect,
}: TOCSidebarProps) {
  const sorted = [...chapters].sort((a, b) => a.order_index - b.order_index);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <Dialog.Title className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Table of Contents
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close table of contents"
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Chapter list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {sorted.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                No chapters
              </p>
            ) : (
              <ul>
                {sorted.map((chapter, idx) => {
                  const isCurrent = chapter.id === currentChapterId;
                  return (
                    <li key={chapter.id}>
                      <button
                        onClick={() => {
                          onChapterSelect(chapter);
                          onOpenChange(false);
                        }}
                        className={[
                          "w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors",
                          isCurrent
                            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                        ].join(" ")}
                      >
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 w-5 shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="text-sm leading-snug flex-1 min-w-0">
                          {chapter.title}
                        </span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
