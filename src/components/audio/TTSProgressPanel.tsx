"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { AudioChapter, Chapter, Audiobook } from "@/types";

interface TTSProgressPanelProps {
  audiobook: Audiobook;
  chapters: Chapter[];
  audioChapters: AudioChapter[];
  onCancel: () => Promise<void>;
  onComplete: () => void;
  className?: string;
}

type ChapterStatus = AudioChapter["status"];

const STATUS_LABEL: Record<ChapterStatus, string> = {
  pending: "Pending",
  processing: "Generating…",
  completed: "Done",
  failed: "Failed",
};

function StatusBadge({ status }: { status: ChapterStatus }) {
  const base = "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium";
  switch (status) {
    case "completed":
      return (
        <span className={cn(base, "bg-green-100 text-green-700")}>
          <CheckCircle2 className="h-3 w-3" />
          {STATUS_LABEL[status]}
        </span>
      );
    case "processing":
      return (
        <span className={cn(base, "bg-blue-100 text-blue-700")}>
          <Spinner size="sm" />
          {STATUS_LABEL[status]}
        </span>
      );
    case "failed":
      return (
        <span className={cn(base, "bg-red-100 text-red-700")}>
          <XCircle className="h-3 w-3" />
          {STATUS_LABEL[status]}
        </span>
      );
    default:
      return (
        <span className={cn(base, "bg-gray-100 text-gray-500")}>
          <Clock className="h-3 w-3" />
          {STATUS_LABEL[status]}
        </span>
      );
  }
}

function estimateSecondsRemaining(
  chapters: Chapter[],
  audioChapters: AudioChapter[]
): number | null {
  const completed = audioChapters.filter((ac) => ac.status === "completed").length;
  const processing = audioChapters.filter(
    (ac) => ac.status === "processing"
  ).length;
  const remaining = chapters.length - completed;
  if (remaining === 0) return 0;
  if (completed === 0 && processing === 0) return null;
  // ~30 seconds per chapter as rough estimate
  return remaining * 30;
}

function formatEta(seconds: number | null): string {
  if (seconds === null) return "Calculating…";
  if (seconds === 0) return "Almost done";
  if (seconds < 60) return `~${seconds}s remaining`;
  const m = Math.ceil(seconds / 60);
  return `~${m} min remaining`;
}

export function TTSProgressPanel({
  audiobook,
  chapters,
  audioChapters: initialAudioChapters,
  onCancel,
  onComplete,
  className,
}: TTSProgressPanelProps) {
  const [audioChapters, setAudioChapters] =
    useState<AudioChapter[]>(initialAudioChapters);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const completedCount = audioChapters.filter(
    (ac) => ac.status === "completed"
  ).length;
  const failedCount = audioChapters.filter(
    (ac) => ac.status === "failed"
  ).length;
  const totalCount = chapters.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const eta = estimateSecondsRemaining(chapters, audioChapters);

  // Poll + Supabase Realtime subscription
  const fetchLatest = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("audio_chapters")
      .select("*")
      .eq("audiobook_id", audiobook.id);
    if (data) {
      setAudioChapters(data as AudioChapter[]);
    }
  }, [audiobook.id]);

  useEffect(() => {
    const supabase = createClient();

    // Realtime channel
    const channel = supabase
      .channel(`audiobook-${audiobook.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audio_chapters",
          filter: `audiobook_id=eq.${audiobook.id}`,
        },
        () => {
          fetchLatest();
        }
      )
      .subscribe();

    // Polling fallback every 5s
    const interval = setInterval(fetchLatest, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [audiobook.id, fetchLatest]);

  // Trigger completion when all done
  useEffect(() => {
    const allDone = audioChapters.length > 0 &&
      audioChapters.every(
        (ac) => ac.status === "completed" || ac.status === "failed"
      );
    const hasCompleted = audioChapters.some((ac) => ac.status === "completed");
    if (allDone && hasCompleted && completedCount === totalCount) {
      onComplete();
    }
  }, [audioChapters, completedCount, totalCount, onComplete]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel();
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Generating Audiobook
            </h3>
            <p className="text-xs text-gray-400">{formatEta(eta)}</p>
          </div>
        </div>

        {failedCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {failedCount} failed
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="px-5 py-3 border-b border-gray-50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">
            {completedCount} / {totalCount} chapters complete
          </span>
          <span className="text-xs font-semibold text-gray-700">
            {progressPct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full bg-gray-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Chapter list */}
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
        <AnimatePresence initial={false}>
          {chapters.map((chapter, index) => {
            const ac = audioChapters.find(
              (a) => a.chapter_id === chapter.id
            );
            const status: ChapterStatus = ac?.status ?? "pending";

            return (
              <motion.div
                key={chapter.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="flex items-center justify-between px-5 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-gray-400 shrink-0 w-5">
                    {String(chapter.order_index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {chapter.title}
                  </span>
                </div>
                <StatusBadge status={status} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Cancel section */}
      <div className="border-t border-gray-100 px-5 py-3">
        <AnimatePresence mode="wait">
          {showCancelConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-sm text-gray-700">
                Cancel generation? Progress will be lost.
              </span>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                >
                  Keep going
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCancel}
                  isLoading={isCancelling}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
              >
                <X className="h-3.5 w-3.5" />
                Cancel generation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
