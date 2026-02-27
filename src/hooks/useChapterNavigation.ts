import type { Chapter } from "@/types";
import { useCallback, useMemo } from "react";

interface UseChapterNavigationOptions {
  chapters: Chapter[];
  currentChapterId: string;
  onChapterChange: (chapter: Chapter) => void;
}

interface UseChapterNavigationReturn {
  currentChapter: Chapter | undefined;
  nextChapter: Chapter | undefined;
  prevChapter: Chapter | undefined;
  goToChapter: (chapter: Chapter) => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentIndex: number;
}

export function useChapterNavigation({
  chapters,
  currentChapterId,
  onChapterChange,
}: UseChapterNavigationOptions): UseChapterNavigationReturn {
  const sorted = useMemo(
    () => [...chapters].sort((a, b) => a.order_index - b.order_index),
    [chapters]
  );

  const currentIndex = useMemo(
    () => sorted.findIndex((c) => c.id === currentChapterId),
    [sorted, currentChapterId]
  );

  const currentChapter = sorted[currentIndex];
  const prevChapter = currentIndex > 0 ? sorted[currentIndex - 1] : undefined;
  const nextChapter =
    currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : undefined;

  const goToChapter = useCallback(
    (chapter: Chapter) => {
      onChapterChange(chapter);
    },
    [onChapterChange]
  );

  return {
    currentChapter,
    nextChapter,
    prevChapter,
    goToChapter,
    hasNext: !!nextChapter,
    hasPrev: !!prevChapter,
    currentIndex,
  };
}
