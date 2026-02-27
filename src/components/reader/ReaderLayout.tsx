"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Book, Chapter, Highlight, Bookmark } from "@/types";
import { useReaderSettings } from "@/hooks/useReaderSettings";
import { useHighlights } from "@/hooks/useHighlights";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";

import { ReaderToolbar } from "./ReaderToolbar";
import { ReaderContent } from "./ReaderContent";
import { ReaderFooter } from "./ReaderFooter";
import { ProgressBar } from "./ProgressBar";
import { SettingsPanel } from "./SettingsPanel";
import { BookmarkButton } from "./BookmarkButton";
import { BookmarkList } from "./BookmarkList";
import { HighlightList } from "./HighlightList";
import { TOCSidebar } from "./TOCSidebar";

interface ReaderLayoutProps {
  book: Book;
  chapters: Chapter[];
  initialChapterId: string;
}

const themeWrapper: Record<string, string> = {
  light: "bg-white text-gray-900",
  dark: "bg-gray-950 text-gray-100",
  sepia: "bg-amber-50 text-amber-950",
};

export function ReaderLayout({
  book,
  chapters,
  initialChapterId,
}: ReaderLayoutProps) {
  const router = useRouter();

  // Settings
  const { preferences, updateSettings } = useReaderSettings();
  const { theme, fontSize, lineHeight } = preferences;

  // Current chapter state
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetPage, setTargetPage] = useState<number | undefined>(undefined);

  // Panel visibility
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  // Data hooks
  const { highlights, createHighlight, deleteHighlight } = useHighlights(book.id);
  const { bookmarks, isPageBookmarked, toggleBookmark, deleteBookmark } =
    useBookmarks(book.id);
  const { saveProgress } = useReadingProgress(book.id);

  // Chapter navigation
  const { currentChapter, nextChapter, prevChapter, goToChapter, hasNext, hasPrev } =
    useChapterNavigation({
      chapters,
      currentChapterId,
      onChapterChange: (chapter) => {
        setCurrentChapterId(chapter.id);
        setTargetPage(1);
      },
    });

  // Page change handler — also saves progress
  const handlePageChange = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page);
      setTotalPages(total);
      if (currentChapter) {
        const percentage = total > 0 ? Math.round((page / total) * 100) : 0;
        saveProgress({
          chapter_id: currentChapter.id,
          page_number: page,
          total_pages: total,
          percentage,
        });
      }
    },
    [currentChapter, saveProgress]
  );

  // Navigate to bookmark
  const handleBookmarkNavigate = useCallback(
    (chapterId: string, pageNumber: number) => {
      if (chapterId !== currentChapterId) {
        const chapter = chapters.find((c) => c.id === chapterId);
        if (chapter) goToChapter(chapter);
      }
      setTargetPage(pageNumber);
    },
    [currentChapterId, chapters, goToChapter]
  );

  // Navigate to highlight chapter
  const handleHighlightNavigate = useCallback(
    (chapterId: string) => {
      if (chapterId !== currentChapterId) {
        const chapter = chapters.find((c) => c.id === chapterId);
        if (chapter) goToChapter(chapter);
      }
    },
    [currentChapterId, chapters, goToChapter]
  );

  const percentage =
    totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  const isCurrentPageBookmarked = currentChapter
    ? isPageBookmarked(currentChapter.id, currentPage)
    : false;

  if (!currentChapter) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Chapter not found.
      </div>
    );
  }

  return (
    <div
      className={[
        "flex flex-col h-screen w-screen overflow-hidden",
        themeWrapper[theme],
      ].join(" ")}
    >
      {/* Toolbar */}
      <ReaderToolbar
        bookTitle={book.title}
        onBack={() => router.back()}
        onSettingsOpen={() => setSettingsOpen(true)}
        onBookmarksOpen={() => setBookmarksOpen((v) => !v)}
        onHighlightsOpen={() => setHighlightsOpen((v) => !v)}
        onTOCOpen={() => setTocOpen(true)}
      />

      {/* Progress bar */}
      <ProgressBar
        currentPage={currentPage}
        totalPages={totalPages}
        percentage={percentage}
        className="px-4 pt-1"
      />

      {/* Reading content */}
      <ReaderContent
        chapter={currentChapter}
        highlights={highlights}
        theme={theme}
        fontSize={fontSize}
        lineHeight={lineHeight}
        onPageChange={handlePageChange}
        onHighlightCreate={createHighlight}
        targetPage={targetPage}
      />

      {/* Bookmark toggle in content area (floating) */}
      <div className="absolute right-4 bottom-16 z-10">
        <BookmarkButton
          isBookmarked={isCurrentPageBookmarked}
          onToggle={() =>
            toggleBookmark(currentChapter.id, currentPage)
          }
        />
      </div>

      {/* Footer */}
      <ReaderFooter
        chapterTitle={currentChapter.title}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNextChapter={() => nextChapter && goToChapter(nextChapter)}
        onPrevChapter={() => prevChapter && goToChapter(prevChapter)}
      />

      {/* Panels */}
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        fontSize={fontSize}
        lineHeight={lineHeight}
        theme={theme}
        onFontSizeChange={(v) => updateSettings({ fontSize: v })}
        onLineHeightChange={(v) => updateSettings({ lineHeight: v })}
        onThemeChange={(v) => updateSettings({ theme: v })}
      />

      <BookmarkList
        open={bookmarksOpen}
        onOpenChange={setBookmarksOpen}
        bookmarks={bookmarks}
        chapters={chapters}
        onNavigate={handleBookmarkNavigate}
        onDelete={deleteBookmark}
      >
        {/* BookmarkList requires a trigger child — we drive it from toolbar,
            so we pass an invisible span as the trigger anchor */}
        <span />
      </BookmarkList>

      <HighlightList
        open={highlightsOpen}
        onOpenChange={setHighlightsOpen}
        highlights={highlights}
        chapters={chapters}
        onNavigate={handleHighlightNavigate}
        onDelete={deleteHighlight}
      >
        <span />
      </HighlightList>

      <TOCSidebar
        open={tocOpen}
        onOpenChange={setTocOpen}
        chapters={chapters}
        currentChapterId={currentChapterId}
        onChapterSelect={goToChapter}
      />
    </div>
  );
}
