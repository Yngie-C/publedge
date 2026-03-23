"use client";

import Link from "next/link";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/types";

interface ChapterListProps {
  bookId: string;
  chapters: Chapter[];
  currentChapterId?: string;
  readChapterIds?: string[];
}

export function ChapterList({
  bookId,
  chapters,
  currentChapterId,
  readChapterIds = [],
}: ChapterListProps) {
  const readSet = new Set(readChapterIds);

  if (chapters.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">아직 발행된 챕터가 없습니다.</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {chapters.map((chapter, idx) => {
        const isRead = readSet.has(chapter.id);
        const isCurrent = chapter.id === currentChapterId;
        const publishedAt = chapter.published_at
          ? new Date(chapter.published_at).toLocaleDateString("ko-KR")
          : null;

        return (
          <Link
            key={chapter.id}
            href={`/reader/${bookId}?chapter=${chapter.id}`}
            className={cn(
              "flex items-center justify-between px-5 py-3.5 text-sm transition-colors hover:bg-gray-50",
              idx > 0 && "border-t border-gray-100",
              isCurrent && "bg-brand-50",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {isRead ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-brand-500" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0 text-gray-300" />
              )}
              <div className="min-w-0">
                <span
                  className={cn(
                    "block truncate font-medium",
                    isCurrent ? "text-brand-600" : "text-gray-800",
                    isRead && !isCurrent && "text-gray-500",
                  )}
                >
                  {chapter.order_index + 1}화. {chapter.title}
                </span>
                {publishedAt && (
                  <span className="text-xs text-gray-400">{publishedAt}</span>
                )}
              </div>
            </div>
            <span className="flex-shrink-0 ml-4 text-xs text-gray-400">
              {chapter.word_count.toLocaleString()}자
            </span>
          </Link>
        );
      })}
    </div>
  );
}
