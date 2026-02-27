"use client";

import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { WaveformVisualizer } from "./WaveformVisualizer";
import type { AudioChapter, Chapter } from "@/types";

interface AudioChapterListProps {
  chapters: Chapter[];
  audioChapters: AudioChapter[];
  currentChapterIndex: number;
  isPlaying: boolean;
  onChapterSelect: (index: number) => void;
  totalDurationSeconds: number | null;
  className?: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StatusIcon({ status }: { status: AudioChapter["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    case "processing":
      return <Spinner size="sm" className="shrink-0" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-gray-400 shrink-0" />;
  }
}

export function AudioChapterList({
  chapters,
  audioChapters,
  currentChapterIndex,
  isPlaying,
  onChapterSelect,
  totalDurationSeconds,
  className,
}: AudioChapterListProps) {
  const completedCount = audioChapters.filter(
    (ac) => ac.status === "completed"
  ).length;
  const overallProgress =
    chapters.length > 0
      ? Math.round((completedCount / chapters.length) * 100)
      : 0;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">
          Chapters ({chapters.length})
        </h2>
        <div className="flex items-center gap-3">
          {totalDurationSeconds !== null && (
            <span className="text-xs text-gray-400">
              Total: {formatDuration(totalDurationSeconds)}
            </span>
          )}
          <span className="text-xs text-gray-500">{overallProgress}% ready</span>
        </div>
      </div>

      {/* Chapter list */}
      <div className="overflow-y-auto flex-1">
        {chapters.map((chapter, index) => {
          const audioChapter = audioChapters.find(
            (ac) => ac.chapter_id === chapter.id
          );
          const isCurrent = index === currentChapterIndex;
          const isClickable =
            audioChapter?.status === "completed" && audioChapter.audio_url !== null;

          return (
            <button
              key={chapter.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onChapterSelect(index)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors",
                isCurrent
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-50",
                !isClickable && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Chapter number */}
              <span
                className={cn(
                  "text-xs font-mono w-6 shrink-0",
                  isCurrent ? "text-gray-300" : "text-gray-400"
                )}
              >
                {String(chapter.order_index + 1).padStart(2, "0")}
              </span>

              {/* Title + playing indicator */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    isCurrent ? "text-white" : "text-gray-900"
                  )}
                >
                  {chapter.title}
                </span>
                {isCurrent && isPlaying && (
                  <WaveformVisualizer
                    isPlaying
                    barCount={4}
                    className={cn(
                      "shrink-0",
                      isCurrent ? "text-white" : "text-gray-900"
                    )}
                  />
                )}
              </div>

              {/* Duration */}
              <span
                className={cn(
                  "text-xs shrink-0",
                  isCurrent ? "text-gray-300" : "text-gray-400"
                )}
              >
                {formatDuration(audioChapter?.duration_seconds ?? null)}
              </span>

              {/* Status icon */}
              {!isCurrent && audioChapter && (
                <StatusIcon status={audioChapter.status} />
              )}
              {isCurrent && (
                <AlertCircle className="h-4 w-4 text-white shrink-0" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
