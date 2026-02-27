import type { AudioChapter, Audiobook } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// API helpers
// ============================================================

interface AudiobookStatusResponse {
  audiobook: Audiobook | null;
  chapters: AudioChapterWithMeta[];
  summary: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
    pending: number;
  };
  all_audiobooks: Audiobook[];
}

interface AudioChapterWithMeta extends AudioChapter {
  chapters?: {
    id: string;
    title: string;
    order_index: number;
  };
}

interface GenerateTTSInput {
  book_id: string;
  voice_id?: string;
  voice_provider?: string;
}

interface GenerateTTSResponse {
  audiobook_id: string;
  status: string;
}

async function fetchAudiobookStatus(
  bookId: string
): Promise<AudiobookStatusResponse> {
  const res = await fetch(`/api/tts/status/${bookId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Failed to fetch audiobook status");
  }
  const json = await res.json();
  return json.data;
}

async function generateTTS(
  input: GenerateTTSInput
): Promise<GenerateTTSResponse> {
  const res = await fetch("/api/tts/generate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Failed to start TTS generation");
  }
  const json = await res.json();
  return json.data;
}

// ============================================================
// useAudiobook — fetch audiobook + audio chapters
// ============================================================

export function useAudiobook(bookId: string) {
  const queryKey = ["audiobook", bookId];

  const query = useQuery<AudiobookStatusResponse>({
    queryKey,
    queryFn: () => fetchAudiobookStatus(bookId),
    enabled: !!bookId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: (query) => {
      // Poll while processing
      const data = query.state.data;
      if (
        data?.audiobook?.status === "processing" ||
        data?.audiobook?.status === "pending"
      ) {
        return 5000; // Poll every 5s while processing
      }
      return false;
    },
  });

  return {
    audiobook: query.data?.audiobook ?? null,
    chapters: query.data?.chapters ?? [],
    summary: query.data?.summary ?? null,
    allAudiobooks: query.data?.all_audiobooks ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================================
// useGenerateTTS — start TTS generation
// ============================================================

export function useGenerateTTS() {
  const queryClient = useQueryClient();

  const mutation = useMutation<GenerateTTSResponse, Error, GenerateTTSInput>({
    mutationFn: generateTTS,
    onSuccess: (_data, variables) => {
      // Invalidate to pick up new processing state
      queryClient.invalidateQueries({
        queryKey: ["audiobook", variables.book_id],
      });
    },
  });

  return {
    generateTTS: mutation.mutate,
    generateTTSAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

// ============================================================
// useAudiobookRealtime — subscribe to audio_chapter updates
// ============================================================

export function useAudiobookRealtime(
  audiobookId: string | null | undefined,
  bookId: string
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!audiobookId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`audiobook:${audiobookId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "audio_chapters",
          filter: `audiobook_id=eq.${audiobookId}`,
        },
        () => {
          // Invalidate the audiobook query to refetch fresh data
          queryClient.invalidateQueries({
            queryKey: ["audiobook", bookId],
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "audiobooks",
          filter: `id=eq.${audiobookId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["audiobook", bookId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [audiobookId, bookId, queryClient]);
}
