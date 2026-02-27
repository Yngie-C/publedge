import { useAuthStore } from "@/stores/auth-store";
import type { ReadingProgress } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

interface SaveProgressInput {
  chapter_id: string;
  page_number: number;
  total_pages: number;
  percentage: number;
}

async function fetchProgress(bookId: string): Promise<ReadingProgress | null> {
  const res = await fetch(`/api/reader/progress?bookId=${bookId}`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function saveProgress(
  bookId: string,
  input: SaveProgressInput
): Promise<ReadingProgress> {
  const res = await fetch(`/api/reader/progress?bookId=${bookId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, ...input }),
  });
  if (!res.ok) throw new Error("Failed to save progress");
  const json = await res.json();
  return json.data;
}

export function useReadingProgress(bookId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["progress", bookId];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: progress, isLoading } = useQuery<ReadingProgress | null>({
    queryKey,
    queryFn: () => fetchProgress(bookId),
    enabled: !!user && !!bookId,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: (input: SaveProgressInput) => saveProgress(bookId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<ReadingProgress | null>(queryKey, updated);
    },
  });

  /**
   * Debounced save — waits 2 seconds after the last call before persisting.
   */
  const saveProgressDebounced = useCallback(
    (input: SaveProgressInput) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        saveMutation.mutate(input);
      }, 2000);
    },
    [saveMutation]
  );

  const saveProgressImmediate = useCallback(
    (input: SaveProgressInput) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      saveMutation.mutate(input);
    },
    [saveMutation]
  );

  return {
    progress,
    isLoading,
    saveProgress: saveProgressDebounced,
    saveProgressImmediate,
    isSaving: saveMutation.isPending,
  };
}
