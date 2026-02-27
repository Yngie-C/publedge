"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useReducer,
} from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { VolumeControl } from "./VolumeControl";
import { PlaybackSpeedButton } from "./PlaybackSpeedButton";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { cn } from "@/lib/utils";
import type { AudioChapter, Chapter } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AudioPlayerChapter {
  chapter: Chapter;
  audioChapter: AudioChapter;
}

interface AudioPlayerProps {
  chapters: AudioPlayerChapter[];
  currentChapterIndex: number;
  onChapterChange: (index: number) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  initialPosition?: number;
  onPositionChange?: (chapterId: string, positionSeconds: number) => void;
  totalDurationSeconds: number | null;
  className?: string;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isError: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  buffered: number;
}

type PlayerAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "LOADING" }
  | { type: "LOADED"; duration: number }
  | { type: "ERROR" }
  | { type: "TIME_UPDATE"; currentTime: number; buffered: number }
  | { type: "DURATION"; duration: number }
  | { type: "ENDED" }
  | { type: "VOLUME"; volume: number }
  | { type: "RESET" };

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "PLAY":
      return { ...state, isPlaying: true, isLoading: false, isError: false };
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "LOADING":
      return { ...state, isLoading: true, isError: false };
    case "LOADED":
      return { ...state, isLoading: false, duration: action.duration };
    case "ERROR":
      return { ...state, isLoading: false, isPlaying: false, isError: true };
    case "TIME_UPDATE":
      return { ...state, currentTime: action.currentTime, buffered: action.buffered };
    case "DURATION":
      return { ...state, duration: action.duration };
    case "ENDED":
      return { ...state, isPlaying: false, currentTime: state.duration };
    case "VOLUME":
      return { ...state, volume: action.volume };
    case "RESET":
      return {
        ...state,
        isPlaying: false,
        isLoading: true,
        isError: false,
        currentTime: 0,
        duration: 0,
        buffered: 0,
      };
    default:
      return state;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AudioPlayer({
  chapters,
  currentChapterIndex,
  onChapterChange,
  playbackSpeed,
  onSpeedChange,
  initialPosition = 0,
  onPositionChange,
  totalDurationSeconds,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekbarRef = useRef<HTMLDivElement | null>(null);
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPositionApplied = useRef(false);

  const [state, dispatch] = useReducer(playerReducer, {
    isPlaying: false,
    isLoading: true,
    isError: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    buffered: 0,
  });

  const currentEntry = chapters[currentChapterIndex] ?? null;
  const audioUrl = currentEntry?.audioChapter.audio_url ?? null;

  // ── Audio element wiring ──────────────────────────────────────────────────

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    dispatch({ type: "RESET" });
    initialPositionApplied.current = false;

    if (!audioUrl) {
      dispatch({ type: "ERROR" });
      return;
    }

    audio.src = audioUrl;
    audio.playbackRate = playbackSpeed;
    audio.volume = state.volume;
    audio.load();

    const onCanPlay = () => {
      dispatch({ type: "LOADED", duration: audio.duration });
      if (!initialPositionApplied.current && initialPosition > 0) {
        audio.currentTime = initialPosition;
        initialPositionApplied.current = true;
      }
    };

    const onPlay = () => dispatch({ type: "PLAY" });
    const onPause = () => dispatch({ type: "PAUSE" });
    const onEnded = () => {
      dispatch({ type: "ENDED" });
      // Auto-advance to next chapter
      if (currentChapterIndex < chapters.length - 1) {
        onChapterChange(currentChapterIndex + 1);
      }
    };
    const onError = () => dispatch({ type: "ERROR" });
    const onDurationChange = () => {
      if (isFinite(audio.duration)) {
        dispatch({ type: "DURATION", duration: audio.duration });
      }
    };
    const onTimeUpdate = () => {
      let bufferedEnd = 0;
      if (audio.buffered.length > 0) {
        bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
      }
      const bufferedPct = audio.duration > 0 ? (bufferedEnd / audio.duration) * 100 : 0;
      dispatch({
        type: "TIME_UPDATE",
        currentTime: audio.currentTime,
        buffered: bufferedPct,
      });

      // Debounced position save
      if (onPositionChange && currentEntry) {
        if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current);
        positionSaveTimer.current = setTimeout(() => {
          onPositionChange(currentEntry.chapter.id, audio.currentTime);
        }, 2000);
      }
    };
    const onWaiting = () => dispatch({ type: "LOADING" });
    const onPlaying = () => dispatch({ type: "PLAY" });

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, currentChapterIndex]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || state.isError) return;
    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => dispatch({ type: "ERROR" }));
    }
  }, [state.isPlaying, state.isError]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || state.duration === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * state.duration;
    },
    [state.duration]
  );

  const seekRelative = useCallback(
    (delta: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(
        0,
        Math.min(state.duration, audio.currentTime + delta)
      );
    },
    [state.duration]
  );

  const handleVolumeChange = useCallback((v: number) => {
    dispatch({ type: "VOLUME", volume: v });
  }, []);

  const handleRetry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    dispatch({ type: "RESET" });
    audio.src = audioUrl;
    audio.load();
  }, [audioUrl]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          dispatch({
            type: "VOLUME",
            volume: Math.min(1, state.volume + 0.1),
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          dispatch({
            type: "VOLUME",
            volume: Math.max(0, state.volume - 0.1),
          });
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlayPause, seekRelative, state.volume]);

  // ── Derived values ────────────────────────────────────────────────────────

  const progressPct =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const totalListened = chapters
    .slice(0, currentChapterIndex)
    .reduce((sum, c) => sum + (c.audioChapter.duration_seconds ?? 0), 0);
  const overallProgress =
    totalDurationSeconds && totalDurationSeconds > 0
      ? Math.round(
          ((totalListened + state.currentTime) / totalDurationSeconds) * 100
        )
      : 0;

  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex < chapters.length - 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl bg-white border border-gray-200 shadow-sm p-6",
        className
      )}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Chapter title + waveform */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">
            Chapter {currentChapterIndex + 1} of {chapters.length}
          </p>
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {currentEntry?.chapter.title ?? "—"}
          </h2>
        </div>
        <WaveformVisualizer
          isPlaying={state.isPlaying}
          barCount={5}
          className="text-gray-400 shrink-0"
        />
      </div>

      {/* Error state */}
      {state.isError && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Failed to load audio
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 transition-colors focus:outline-none"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Seek bar */}
      <div className="flex flex-col gap-1">
        <div
          ref={seekbarRef}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(state.currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(state.duration)}
          tabIndex={0}
          className="relative h-2 rounded-full bg-gray-100 cursor-pointer group"
          onClick={handleSeek}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") seekRelative(5);
            if (e.key === "ArrowLeft") seekRelative(-5);
          }}
        >
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gray-200"
            style={{ width: `${state.buffered}%` }}
          />
          {/* Played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gray-900 transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-gray-900 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-gray-400 select-none">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Previous chapter */}
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => onChapterChange(currentChapterIndex - 1)}
          className="rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          aria-label="Previous chapter"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        {/* Seek back 10s */}
        <button
          type="button"
          onClick={() => seekRelative(-10)}
          className="relative rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          aria-label="Rewind 10 seconds"
        >
          <SkipBack className="h-4 w-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-500 mt-1">
            10
          </span>
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={state.isLoading && !state.isError}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-md hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          aria-label={state.isPlaying ? "Pause" : "Play"}
        >
          {state.isLoading ? (
            <Spinner size="md" className="border-white border-t-gray-600" />
          ) : state.isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 translate-x-0.5" />
          )}
        </button>

        {/* Seek forward 10s */}
        <button
          type="button"
          onClick={() => seekRelative(10)}
          className="relative rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          aria-label="Forward 10 seconds"
        >
          <SkipForward className="h-4 w-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-500 mt-1">
            10
          </span>
        </button>

        {/* Next chapter */}
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onChapterChange(currentChapterIndex + 1)}
          className="rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          aria-label="Next chapter"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom row: speed + volume */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PlaybackSpeedButton speed={playbackSpeed} onSpeedChange={onSpeedChange} />
        <VolumeControl volume={state.volume} onVolumeChange={handleVolumeChange} />
      </div>

      {/* Overall audiobook progress bar */}
      {totalDurationSeconds !== null && totalDurationSeconds > 0 && (
        <div className="flex flex-col gap-1 pt-1 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Overall progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full transition-[width] duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
