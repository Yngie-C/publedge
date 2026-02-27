import { useAuthStore } from "@/stores/auth-store";
import type { Bookmark } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface CreateBookmarkInput {
  chapter_id: string;
  page_number: number;
  note?: string;
}

async function fetchBookmarks(bookId: string): Promise<Bookmark[]> {
  const res = await fetch(`/api/reader/bookmarks?bookId=${bookId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch bookmarks");
  const json = await res.json();
  return json.data ?? [];
}

async function createBookmark(
  bookId: string,
  input: CreateBookmarkInput
): Promise<Bookmark> {
  const res = await fetch(`/api/reader/bookmarks?bookId=${bookId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, ...input }),
  });
  if (!res.ok) throw new Error("Failed to create bookmark");
  const json = await res.json();
  return json.data;
}

async function deleteBookmark(id: string): Promise<void> {
  const res = await fetch(`/api/reader/bookmarks?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete bookmark");
}

export function useBookmarks(bookId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["bookmarks", bookId];

  const { data: bookmarks = [], isLoading } = useQuery<Bookmark[]>({
    queryKey,
    queryFn: () => fetchBookmarks(bookId),
    enabled: !!user && !!bookId,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateBookmarkInput) => createBookmark(bookId, input),
    onSuccess: (newBookmark) => {
      queryClient.setQueryData<Bookmark[]>(queryKey, (old = []) => [
        ...old,
        newBookmark,
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBookmark(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Bookmark[]>(queryKey, (old = []) =>
        old.filter((b) => b.id !== id)
      );
    },
  });

  const isPageBookmarked = useCallback(
    (chapterId: string, pageNumber: number) =>
      bookmarks.some(
        (b) => b.chapter_id === chapterId && b.page_number === pageNumber
      ),
    [bookmarks]
  );

  const getBookmarkForPage = useCallback(
    (chapterId: string, pageNumber: number) =>
      bookmarks.find(
        (b) => b.chapter_id === chapterId && b.page_number === pageNumber
      ),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (chapterId: string, pageNumber: number) => {
      const existing = getBookmarkForPage(chapterId, pageNumber);
      if (existing) {
        deleteMutation.mutate(existing.id);
      } else {
        createMutation.mutate({ chapter_id: chapterId, page_number: pageNumber });
      }
    },
    [getBookmarkForPage, createMutation, deleteMutation]
  );

  return {
    bookmarks,
    isLoading,
    isPageBookmarked,
    getBookmarkForPage,
    toggleBookmark,
    createBookmark: createMutation.mutate,
    deleteBookmark: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
