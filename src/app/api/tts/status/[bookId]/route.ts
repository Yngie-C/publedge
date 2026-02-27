import { apiError, apiSuccess, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ bookId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { bookId } = await params;

  if (!bookId) {
    return apiError("bookId is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  // Verify user owns the book (or book is public)
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, owner_id, visibility, status")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }

  const isOwner = book.owner_id === user.id;
  const isPublic =
    book.visibility === "public" && book.status === "published";

  if (!isOwner && !isPublic) {
    return apiError("Forbidden", "FORBIDDEN", 403);
  }

  // Fetch all audiobooks for this book
  const { data: audiobooks, error: audiobooksError } = await supabase
    .from("audiobooks")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (audiobooksError) {
    return apiError("Failed to fetch audiobooks", "SERVER_ERROR", 500);
  }

  if (!audiobooks || audiobooks.length === 0) {
    return apiSuccess({ audiobook: null, chapters: [] });
  }

  // Return the most recent audiobook with its chapters
  const latestAudiobook = audiobooks[0];

  const { data: audioChapters, error: chaptersError } = await supabase
    .from("audio_chapters")
    .select(
      `
      *,
      chapters (
        id,
        title,
        order_index
      )
    `
    )
    .eq("audiobook_id", latestAudiobook.id)
    .order("chapters(order_index)", { ascending: true });

  if (chaptersError) {
    return apiError("Failed to fetch audio chapters", "SERVER_ERROR", 500);
  }

  // Compute summary stats
  const totalChapters = audioChapters?.length ?? 0;
  const completedChapters =
    audioChapters?.filter((c) => c.status === "completed").length ?? 0;
  const failedChapters =
    audioChapters?.filter((c) => c.status === "failed").length ?? 0;
  const processingChapters =
    audioChapters?.filter((c) => c.status === "processing").length ?? 0;

  return apiSuccess({
    audiobook: latestAudiobook,
    chapters: audioChapters ?? [],
    summary: {
      total: totalChapters,
      completed: completedChapters,
      failed: failedChapters,
      processing: processingChapters,
      pending: totalChapters - completedChapters - failedChapters - processingChapters,
    },
    all_audiobooks: audiobooks,
  });
}
