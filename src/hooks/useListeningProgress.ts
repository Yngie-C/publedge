import { useAuthStore } from "@/stores/auth-store";
import type { ListeningProgress } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

// ============================================================
// API helpers
// ============================================================

interface SaveProgressInput {
  audiobook_id: string;
  chapter_id?: string | null;
  position_seconds: number;
  playback_speed: number;
}

async function fetchListeningProgress(
  audiobookId: string
): Promise<ListeningProgress | null> {
  const res = await fetch(
    `/api/tts/progress?audiobookId=${audiobookId}`,
    { credentials: "include" }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function saveListeningProgress(
  input: SaveProgressInput
): Promise<ListeningProgress> {
  const res = await fetch("/api/tts/progress", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Failed to save listening progress");
  }
  const json = await res.json();
  return json.data;
}

// ============================================================
// Hook
// ============================================================

const DEBOUNCE_MS = 2000;

export function useListeningProgress(audiobookId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["listening-progress", audiobookId];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: progress, isLoading } = useQuery<ListeningProgress | null>({
    queryKey,
    queryFn: () => fetchListeningProgress(audiobookId),
    enabled: !!user && !!audiobookId,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation<ListeningProgress, Error, SaveProgressInput>(
    {
      mutationFn: saveListeningProgress,
      onSuccess: (updated) => {
        queryClient.setQueryData<ListeningProgress | null>(queryKey, updated);
      },
    }
  );

  /**
   * Debounced save — waits DEBOUNCE_MS after the last call before persisting.
   */
  const saveProgress = useCallback(
    (input: Omit<SaveProgressInput, "audiobook_id">) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        saveMutation.mutate({ audiobook_id: audiobookId, ...input });
      }, DEBOUNCE_MS);
    },
    [saveMutation, audiobookId]
  );

  /**
   * Immediate save — flushes any pending debounced save and saves now.
   */
  const saveProgressImmediate = useCallback(
    (input: Omit<SaveProgressInput, "audiobook_id">) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      saveMutation.mutate({ audiobook_id: audiobookId, ...input });
    },
    [saveMutation, audiobookId]
  );

  /**
   * Update just the position (convenience wrapper with debounce).
   */
  const updatePosition = useCallback(
    (positionSeconds: number, chapterId?: string | null) => {
      saveProgress({
        position_seconds: positionSeconds,
        playback_speed: progress?.playback_speed ?? 1.0,
        chapter_id: chapterId ?? progress?.chapter_id ?? null,
      });
    },
    [saveProgress, progress]
  );

  /**
   * Update playback speed (saves immediately).
   */
  const updatePlaybackSpeed = useCallback(
    (speed: number) => {
      saveProgressImmediate({
        position_seconds: progress?.position_seconds ?? 0,
        playback_speed: speed,
        chapter_id: progress?.chapter_id ?? null,
      });
    },
    [saveProgressImmediate, progress]
  );

  return {
    progress,
    isLoading,
    saveProgress,
    saveProgressImmediate,
    updatePosition,
    updatePlaybackSpeed,
    isSaving: saveMutation.isPending,
  };
}
