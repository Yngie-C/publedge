import { useAuthStore } from "@/stores/auth-store";
import type { Highlight } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface CreateHighlightInput {
  chapter_id: string;
  selected_text: string;
  prefix_context?: string;
  suffix_context?: string;
  note?: string;
  color: string;
}

async function fetchHighlights(bookId: string): Promise<Highlight[]> {
  const res = await fetch(`/api/reader/highlights?bookId=${bookId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch highlights");
  const json = await res.json();
  return json.data ?? [];
}

async function createHighlight(
  bookId: string,
  input: CreateHighlightInput
): Promise<Highlight> {
  const res = await fetch(`/api/reader/highlights?bookId=${bookId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, ...input }),
  });
  if (!res.ok) throw new Error("Failed to create highlight");
  const json = await res.json();
  return json.data;
}

async function deleteHighlight(id: string): Promise<void> {
  const res = await fetch(`/api/reader/highlights?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete highlight");
}

export function useHighlights(bookId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["highlights", bookId];

  const { data: highlights = [], isLoading } = useQuery<Highlight[]>({
    queryKey,
    queryFn: () => fetchHighlights(bookId),
    enabled: !!user && !!bookId,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateHighlightInput) => createHighlight(bookId, input),
    onSuccess: (newHighlight) => {
      queryClient.setQueryData<Highlight[]>(queryKey, (old = []) => [
        ...old,
        newHighlight,
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHighlight(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Highlight[]>(queryKey, (old = []) =>
        old.filter((h) => h.id !== id)
      );
    },
  });

  return {
    highlights,
    isLoading,
    createHighlight: createMutation.mutate,
    deleteHighlight: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
