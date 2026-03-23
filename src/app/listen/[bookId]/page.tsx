"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AudioPlayer,
  AudioChapterList,
  TTSGenerateButton,
  TTSProgressPanel,
} from "@/components/audio";
import type { AudioPlayerChapter } from "@/components/audio";
import type { Book, Chapter, Audiobook, AudioChapter, ListeningProgress } from "@/types";

// ─── Page state ──────────────────────────────────────────────────────────────

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "no_audiobook";
      book: Book;
      chapters: Chapter[];
    }
  | {
      status: "processing";
      book: Book;
      chapters: Chapter[];
      audiobook: Audiobook;
      audioChapters: AudioChapter[];
    }
  | {
      status: "ready";
      book: Book;
      chapters: Chapter[];
      audiobook: Audiobook;
      audioChapters: AudioChapter[];
      progress: ListeningProgress | null;
    };

// ─── Component ───────────────────────────────────────────────────────────────

export default function ListenPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // ── Data fetch ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Fetch book
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      setPageState({ status: "error", message: "Book not found." });
      return;
    }

    // Fetch chapters
    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("book_id", bookId)
      .order("order_index", { ascending: true });

    const chapterList: Chapter[] = chapters ?? [];

    // Fetch audiobook
    const { data: audiobookData } = await supabase
      .from("audiobooks")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const audiobook = audiobookData as Audiobook | null;

    if (!audiobook) {
      setPageState({ status: "no_audiobook", book: book as Book, chapters: chapterList });
      return;
    }

    // Fetch audio chapters
    const { data: audioChaptersData } = await supabase
      .from("audio_chapters")
      .select("*")
      .eq("audiobook_id", audiobook.id)
      .order("created_at", { ascending: true });

    const audioChapters: AudioChapter[] = (audioChaptersData ?? []) as AudioChapter[];

    if (audiobook.status === "processing" || audiobook.status === "pending") {
      setPageState({
        status: "processing",
        book: book as Book,
        chapters: chapterList,
        audiobook,
        audioChapters,
      });
      return;
    }

    // Fetch listening progress
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let progress: ListeningProgress | null = null;
    if (user) {
      const { data: progressData } = await supabase
        .from("listening_progress")
        .select("*")
        .eq("audiobook_id", audiobook.id)
        .eq("user_id", user.id)
        .single();
      progress = (progressData as ListeningProgress) ?? null;
    }

    // Restore chapter index from progress
    if (progress?.chapter_id) {
      const savedIndex = chapterList.findIndex((c) => c.id === progress!.chapter_id);
      if (savedIndex >= 0) setCurrentChapterIndex(savedIndex);
    }
    if (progress?.playback_speed) {
      setPlaybackSpeed(progress.playback_speed);
    }

    setPageState({
      status: "ready",
      book: book as Book,
      chapters: chapterList,
      audiobook,
      audioChapters,
      progress,
    });
  }, [bookId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── TTS generation ──────────────────────────────────────────────────────

  const handleGenerate = useCallback(
    async (voiceId: string, voiceProvider?: string, customVoiceId?: string) => {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: bookId,
          voice_id: voiceId,
          voice_provider: voiceProvider ?? "qwen3",
          custom_voice_id: customVoiceId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "오디오북 생성에 실패했습니다.");
      }

      await fetchData();
    },
    [bookId, fetchData]
  );

  // ── TTS cancel ──────────────────────────────────────────────────────────

  const handleCancelTTS = useCallback(async () => {
    if (pageState.status !== "processing") return;
    const supabase = createClient();
    await supabase
      .from("audiobooks")
      .update({ status: "failed" })
      .eq("id", pageState.audiobook.id);
    await fetchData();
  }, [pageState, fetchData]);

  // ── Progress save ───────────────────────────────────────────────────────

  const handlePositionChange = useCallback(
    async (chapterId: string, positionSeconds: number) => {
      if (pageState.status !== "ready") return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("listening_progress").upsert(
        {
          user_id: user.id,
          audiobook_id: pageState.audiobook.id,
          chapter_id: chapterId,
          position_seconds: positionSeconds,
          playback_speed: playbackSpeed,
          last_listened_at: new Date().toISOString(),
        },
        { onConflict: "user_id,audiobook_id" }
      );
    },
    [pageState, playbackSpeed]
  );

  // ── Speed change (also persists) ────────────────────────────────────────

  const handleSpeedChange = useCallback(
    async (speed: number) => {
      setPlaybackSpeed(speed);
      if (pageState.status !== "ready") return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("listening_progress")
        .update({ playback_speed: speed })
        .eq("audiobook_id", pageState.audiobook.id)
        .eq("user_id", user.id);
    },
    [pageState]
  );

  // ── Build AudioPlayerChapter list ────────────────────────────────────────

  function buildPlayerChapters(
    chapters: Chapter[],
    audioChapters: AudioChapter[]
  ): AudioPlayerChapter[] {
    return chapters
      .map((chapter) => {
        const ac = audioChapters.find((a) => a.chapter_id === chapter.id);
        if (!ac || ac.status !== "completed" || !ac.audio_url) return null;
        return { chapter, audioChapter: ac };
      })
      .filter((x): x is AudioPlayerChapter => x !== null);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (pageState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-400">Loading audiobook…</p>
        </div>
      </div>
    );
  }

  if (pageState.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">{pageState.message}</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const { book, chapters } = pageState;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/reader/${bookId}`)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to book</span>
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate">
            {book.title}
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ── No audiobook ─────────────────────────────────────────── */}
        {pageState.status === "no_audiobook" && (
          <motion.div
            key="no_audiobook"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-1 flex-col items-center justify-center px-4 py-16 gap-6"
          >
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                No Audiobook Yet
              </h1>
              <p className="text-sm text-gray-500">
                Generate an audiobook from this book using AI text-to-speech.
                Choose a voice and we&apos;ll process each chapter automatically.
              </p>
            </div>

            <TTSGenerateButton
              bookId={bookId}
              totalChapters={chapters.length}
              totalWords={book.total_words}
              onGenerate={handleGenerate}
            />
          </motion.div>
        )}

        {/* ── Processing ───────────────────────────────────────────── */}
        {pageState.status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-1 flex-col items-center justify-start px-4 py-8 gap-6"
          >
            <TTSProgressPanel
              audiobook={pageState.audiobook}
              chapters={chapters}
              audioChapters={pageState.audioChapters}
              onCancel={handleCancelTTS}
              onComplete={fetchData}
              className="w-full max-w-lg"
            />
          </motion.div>
        )}

        {/* ── Ready ────────────────────────────────────────────────── */}
        {pageState.status === "ready" && (() => {
          const playerChapters = buildPlayerChapters(
            chapters,
            pageState.audioChapters
          );

          // Map the saved chapter index to the player chapters list
          const savedChapter = chapters[currentChapterIndex];
          const playerChapterIndex = savedChapter
            ? playerChapters.findIndex(
                (pc) => pc.chapter.id === savedChapter.id
              )
            : 0;
          const resolvedIndex = playerChapterIndex >= 0 ? playerChapterIndex : 0;

          const handlePlayerChapterChange = (playerIdx: number) => {
            const pc = playerChapters[playerIdx];
            if (!pc) return;
            const chapterIdx = chapters.findIndex((c) => c.id === pc.chapter.id);
            if (chapterIdx >= 0) setCurrentChapterIndex(chapterIdx);
          };

          return (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-col lg:flex-row flex-1 overflow-hidden"
            >
              {/* Player column */}
              <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 overflow-y-auto">
                {playerChapters.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 text-center max-w-sm mt-16">
                    <AlertCircle className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No chapters are ready to play yet.
                    </p>
                  </div>
                ) : (
                  <AudioPlayer
                    chapters={playerChapters}
                    currentChapterIndex={resolvedIndex}
                    onChapterChange={handlePlayerChapterChange}
                    playbackSpeed={playbackSpeed}
                    onSpeedChange={handleSpeedChange}
                    initialPosition={
                      pageState.progress?.chapter_id ===
                      playerChapters[resolvedIndex]?.chapter.id
                        ? pageState.progress?.position_seconds ?? 0
                        : 0
                    }
                    onPositionChange={handlePositionChange}
                    totalDurationSeconds={
                      pageState.audiobook.total_duration_seconds
                    }
                    className="w-full max-w-md"
                  />
                )}
              </div>

              {/* Chapter list column */}
              <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white flex flex-col overflow-hidden max-h-[50vh] lg:max-h-full">
                <AudioChapterList
                  chapters={chapters}
                  audioChapters={pageState.audioChapters}
                  currentChapterIndex={currentChapterIndex}
                  isPlaying={false}
                  onChapterSelect={(idx) => {
                    setCurrentChapterIndex(idx);
                  }}
                  totalDurationSeconds={
                    pageState.audiobook.total_duration_seconds
                  }
                  className="flex-1 overflow-hidden"
                />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
