"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// Types
// ============================================================

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  0.5, 0.75, 1, 1.25, 1.5, 2,
];

export interface AudioChapterSource {
  chapterId: string;
  /** Comma-separated URLs for sequential chunk playback */
  audioUrl: string;
  title: string;
  orderIndex: number;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: PlaybackSpeed;
  currentChapterIndex: number;
  currentChunkIndex: number;
  error: string | null;
  volume: number;
}

export interface AudioPlayerControls {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;
  goToChapter: (index: number) => void;
  nextChapter: () => void;
  prevChapter: () => void;
}

const DEFAULT_SKIP_SECONDS = 15;

// ============================================================
// Hook
// ============================================================

export function useAudioPlayer(
  chapters: AudioChapterSource[],
  options?: {
    initialChapterIndex?: number;
    initialPosition?: number;
    initialSpeed?: PlaybackSpeed;
    onChapterChange?: (chapterId: string, orderIndex: number) => void;
    onTimeUpdate?: (currentTime: number, chapterId: string) => void;
    onEnded?: () => void;
  }
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunkUrlsRef = useRef<string[][]>([]);

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTime: options?.initialPosition ?? 0,
    duration: 0,
    playbackSpeed: options?.initialSpeed ?? 1,
    currentChapterIndex: options?.initialChapterIndex ?? 0,
    currentChunkIndex: 0,
    error: null,
    volume: 1,
  });

  // Parse chunk URLs for each chapter when chapters list changes
  useEffect(() => {
    chunkUrlsRef.current = chapters.map((ch) =>
      ch.audioUrl
        ? ch.audioUrl.split(",").map((u) => u.trim()).filter(Boolean)
        : []
    );
  }, [chapters]);

  // Build current chunk URL
  const getCurrentChunkUrl = useCallback(
    (chapterIdx: number, chunkIdx: number): string | null => {
      const urls = chunkUrlsRef.current[chapterIdx];
      if (!urls || urls.length === 0) return null;
      return urls[chunkIdx] ?? null;
    },
    []
  );

  // ---- Load a specific chunk ----
  const loadChunk = useCallback(
    (chapterIdx: number, chunkIdx: number, autoplay: boolean, startAt = 0) => {
      const url = getCurrentChunkUrl(chapterIdx, chunkIdx);
      if (!url) {
        setState((s) => ({
          ...s,
          error: "No audio available for this chapter",
          isLoading: false,
        }));
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      setState((s) => ({ ...s, isLoading: true, error: null }));

      audio.src = url;
      audio.playbackRate = state.playbackSpeed;
      audio.volume = state.volume;
      audio.load();

      const handleCanPlay = () => {
        setState((s) => ({ ...s, isLoading: false, duration: audio.duration }));
        if (startAt > 0) {
          audio.currentTime = startAt;
        }
        if (autoplay) {
          audio.play().catch((err) => {
            setState((s) => ({ ...s, error: err.message, isPlaying: false }));
          });
        }
        audio.removeEventListener("canplay", handleCanPlay);
      };

      audio.addEventListener("canplay", handleCanPlay);
    },
    [getCurrentChunkUrl, state.playbackSpeed, state.volume]
  );

  // ---- Advance to next chunk or chapter ----
  const advanceToNext = useCallback(
    (chapterIdx: number, chunkIdx: number) => {
      const chunkUrls = chunkUrlsRef.current[chapterIdx] ?? [];
      const nextChunkIdx = chunkIdx + 1;

      if (nextChunkIdx < chunkUrls.length) {
        // Next chunk in same chapter
        setState((s) => ({ ...s, currentChunkIndex: nextChunkIdx }));
        loadChunk(chapterIdx, nextChunkIdx, true);
      } else {
        // Advance to next chapter
        const nextChapterIdx = chapterIdx + 1;
        if (nextChapterIdx < chapters.length) {
          setState((s) => ({
            ...s,
            currentChapterIndex: nextChapterIdx,
            currentChunkIndex: 0,
            currentTime: 0,
          }));
          loadChunk(nextChapterIdx, 0, true);
          options?.onChapterChange?.(
            chapters[nextChapterIdx].chapterId,
            chapters[nextChapterIdx].orderIndex
          );
        } else {
          // All done
          setState((s) => ({ ...s, isPlaying: false }));
          options?.onEnded?.();
        }
      }
    },
    [chapters, loadChunk, options]
  );

  // ---- Create Audio element on mount ----
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("play", () =>
      setState((s) => ({ ...s, isPlaying: true }))
    );
    audio.addEventListener("pause", () =>
      setState((s) => ({ ...s, isPlaying: false }))
    );
    audio.addEventListener("ended", () => {
      setState((s) => {
        advanceToNext(s.currentChapterIndex, s.currentChunkIndex);
        return s;
      });
    });
    audio.addEventListener("timeupdate", () => {
      const ct = audio.currentTime;
      setState((s) => {
        const chapter = chapters[s.currentChapterIndex];
        if (chapter) {
          options?.onTimeUpdate?.(ct, chapter.chapterId);
        }
        return { ...s, currentTime: ct };
      });
    });
    audio.addEventListener("durationchange", () => {
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    });
    audio.addEventListener("waiting", () =>
      setState((s) => ({ ...s, isLoading: true }))
    );
    audio.addEventListener("playing", () =>
      setState((s) => ({ ...s, isLoading: false }))
    );
    audio.addEventListener("error", () => {
      const code = audio.error?.code;
      const msg =
        code === 4
          ? "Audio format not supported"
          : code === 3
          ? "Audio decoding error"
          : code === 2
          ? "Network error loading audio"
          : "Failed to load audio";
      setState((s) => ({ ...s, error: msg, isLoading: false }));
    });

    // Load initial chapter
    if (chapters.length > 0) {
      const initChapter = options?.initialChapterIndex ?? 0;
      const initPosition = options?.initialPosition ?? 0;
      setTimeout(() => {
        loadChunk(initChapter, 0, false, initPosition);
      }, 0);
    }

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Sync playbackRate when speed changes ----
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = state.playbackSpeed;
    }
  }, [state.playbackSpeed]);

  // ---- Sync volume ----
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // ============================================================
  // Controls
  // ============================================================

  const play = useCallback(() => {
    audioRef.current?.play().catch((err) => {
      setState((s) => ({ ...s, error: err.message }));
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch((err) => {
        setState((s) => ({ ...s, error: err.message }));
      });
    } else {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(
      0,
      Math.min(seconds, audioRef.current.duration || 0)
    );
    audioRef.current.currentTime = clamped;
    setState((s) => ({ ...s, currentTime: clamped }));
  }, []);

  const skipForward = useCallback(
    (seconds = DEFAULT_SKIP_SECONDS) => {
      if (!audioRef.current) return;
      seek(audioRef.current.currentTime + seconds);
    },
    [seek]
  );

  const skipBackward = useCallback(
    (seconds = DEFAULT_SKIP_SECONDS) => {
      if (!audioRef.current) return;
      seek(audioRef.current.currentTime - seconds);
    },
    [seek]
  );

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    setState((s) => ({ ...s, playbackSpeed: speed }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setState((s) => ({ ...s, volume: clamped }));
  }, []);

  const goToChapter = useCallback(
    (index: number) => {
      if (index < 0 || index >= chapters.length) return;
      const wasPlaying = !audioRef.current?.paused;
      setState((s) => ({
        ...s,
        currentChapterIndex: index,
        currentChunkIndex: 0,
        currentTime: 0,
      }));
      loadChunk(index, 0, wasPlaying);
      options?.onChapterChange?.(
        chapters[index].chapterId,
        chapters[index].orderIndex
      );
    },
    [chapters, loadChunk, options]
  );

  const nextChapter = useCallback(() => {
    setState((s) => {
      goToChapter(s.currentChapterIndex + 1);
      return s;
    });
  }, [goToChapter]);

  const prevChapter = useCallback(() => {
    setState((s) => {
      // If more than 3 seconds in, restart; otherwise go prev
      if (audioRef.current && audioRef.current.currentTime > 3) {
        seek(0);
      } else {
        goToChapter(s.currentChapterIndex - 1);
      }
      return s;
    });
  }, [goToChapter, seek]);

  const controls: AudioPlayerControls = {
    play,
    pause,
    togglePlayPause,
    seek,
    skipForward,
    skipBackward,
    setPlaybackSpeed,
    setVolume,
    goToChapter,
    nextChapter,
    prevChapter,
  };

  return {
    state,
    controls,
    currentChapter: chapters[state.currentChapterIndex] ?? null,
    totalChapters: chapters.length,
    hasNext: state.currentChapterIndex < chapters.length - 1,
    hasPrev: state.currentChapterIndex > 0,
  };
}
