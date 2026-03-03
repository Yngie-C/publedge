import { apiError, apiSuccess, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
import { processChapterTTS } from "@/lib/tts";


interface GenerateTTSBody {
  book_id: string;
  voice_id?: string;
  voice_provider?: string;
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  let body: GenerateTTSBody;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { book_id, voice_id = "alloy", voice_provider = "openai" } = body;

  if (!book_id) {
    return apiError("book_id is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  // Verify user owns the book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, owner_id, title")
    .eq("id", book_id)
    .single();

  if (bookError || !book) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }

  if (book.owner_id !== user.id) {
    return apiError("Forbidden", "FORBIDDEN", 403);
  }

  // Verify book has chapters
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, content_html, order_index")
    .eq("book_id", book_id)
    .order("order_index", { ascending: true });

  if (chaptersError) {
    return apiError("Failed to fetch chapters", "SERVER_ERROR", 500);
  }

  if (!chapters || chapters.length === 0) {
    return apiError(
      "Book has no chapters to convert",
      "VALIDATION_ERROR",
      400
    );
  }

  // Rate limit: max 1 concurrent TTS job per user
  const { data: processingAudiobooks } = await supabase
    .from("audiobooks")
    .select("id, books!inner(owner_id)")
    .eq("status", "processing")
    .eq("books.owner_id", user.id);

  if (processingAudiobooks && processingAudiobooks.length > 0) {
    return apiError(
      "You already have a TTS job in progress. Please wait for it to complete.",
      "VALIDATION_ERROR",
      429
    );
  }

  // Create audiobook record
  const { data: audiobook, error: audiobookError } = await supabase
    .from("audiobooks")
    .insert({
      book_id,
      voice_id,
      voice_provider,
      status: "pending",
    })
    .select()
    .single();

  if (audiobookError || !audiobook) {
    // Handle unique constraint violation (audiobook already exists for this voice)
    if (audiobookError?.code === "23505") {
      return apiError(
        "An audiobook with this voice already exists for the book",
        "VALIDATION_ERROR",
        409
      );
    }
    return apiError("Failed to create audiobook record", "SERVER_ERROR", 500);
  }

  // Create audio_chapter records for each chapter
  const audioChapterInserts = chapters.map((ch) => ({
    audiobook_id: audiobook.id,
    chapter_id: ch.id,
    status: "pending" as const,
  }));

  const { error: insertChaptersError } = await supabase
    .from("audio_chapters")
    .insert(audioChapterInserts);

  if (insertChaptersError) {
    // Roll back audiobook
    await supabase.from("audiobooks").delete().eq("id", audiobook.id);
    return apiError(
      "Failed to create audio chapter records",
      "SERVER_ERROR",
      500
    );
  }

  // Update audiobook status to processing
  await supabase
    .from("audiobooks")
    .update({ status: "processing" })
    .eq("id", audiobook.id);

  // Start async processing (fire-and-forget)
  // In production this would be handled by the Edge Function / queue
  processAudiobookAsync(audiobook.id, book_id, chapters, voice_id, voice_provider);

  return apiSuccess({ audiobook_id: audiobook.id, status: "processing" }, 202);
}

// Fire-and-forget async processor — runs after response is sent
function processAudiobookAsync(
  audiobookId: string,
  bookId: string,
  chapters: Array<{ id: string; content_html: string; order_index: number }>,
  voice: string,
  provider: string
): void {
  // We intentionally do not await this — the response has already been returned
  (async () => {
    // We need a fresh server-side supabase client for background work
    // Since this runs outside the request context we use the service role key
    const { createClient: createSupabaseClient } = await import(
      "@supabase/supabase-js"
    );
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "",
    );

    let anyFailed = false;
    let totalDuration = 0;

    for (const chapter of chapters) {
      try {
        await processChapterTTS({
          chapterId: chapter.id,
          audiobookId,
          bookId,
          contentHtml: chapter.content_html,
          voice,
          provider,
        });

        // Accumulate duration
        const { data: ac } = await supabase
          .from("audio_chapters")
          .select("duration_seconds")
          .eq("audiobook_id", audiobookId)
          .eq("chapter_id", chapter.id)
          .single();

        if (ac?.duration_seconds) {
          totalDuration += ac.duration_seconds;
        }
      } catch {
        anyFailed = true;
      }
    }

    const finalStatus = anyFailed ? "failed" : "completed";
    await supabase
      .from("audiobooks")
      .update({
        status: finalStatus,
        total_duration_seconds: totalDuration > 0 ? totalDuration : null,
      })
      .eq("id", audiobookId);
  })().catch(console.error);
}
