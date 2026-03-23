import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

const NOTIFICATION_BATCH_SIZE = 100;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const { seriesId } = await params;

  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { chapterId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { chapterId } = body;
  if (!chapterId || typeof chapterId !== "string") {
    return apiError("chapterId is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  // Verify series ownership
  const { data: series, error: seriesError } = await supabase
    .from("books")
    .select("owner_id, title")
    .eq("id", seriesId)
    .eq("content_type", "series")
    .single();

  if (seriesError || !series) return apiError("Series not found", "NOT_FOUND", 404);
  if (series.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  // Verify chapter belongs to this series and is currently draft
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, title, book_id, status, order_index, slug")
    .eq("id", chapterId)
    .eq("book_id", seriesId)
    .single();

  if (chapterError || !chapter) return apiError("Chapter not found", "NOT_FOUND", 404);
  if (chapter.status === "published") {
    return apiError("Chapter is already published", "VALIDATION_ERROR", 400);
  }

  const now = new Date().toISOString();

  // Publish the chapter
  const { data: publishedChapter, error: publishError } = await supabase
    .from("chapters")
    .update({ status: "published", published_at: now })
    .eq("id", chapterId)
    .select()
    .single();

  if (publishError) return apiError(publishError.message, "SERVER_ERROR", 500);

  // Update series_metadata.last_chapter_published_at
  await supabase
    .from("series_metadata")
    .update({ last_chapter_published_at: now })
    .eq("book_id", seriesId);

  // Fetch all subscribers (fire-and-forget notification creation)
  const { data: subscribers } = await supabase
    .from("series_subscriptions")
    .select("user_id")
    .eq("series_id", seriesId)
    .eq("notify_enabled", true);

  if (subscribers && subscribers.length > 0) {
    const chapterLink = `/book/${seriesId}/chapter/${chapter.slug}`;
    const notifications = subscribers.map((sub) => ({
      user_id: sub.user_id,
      type: "new_chapter" as const,
      title: `새 챕터: ${series.title}`,
      body: chapter.title,
      link: chapterLink,
      metadata: {
        series_id: seriesId,
        chapter_id: chapterId,
        chapter_order: chapter.order_index,
      },
    }));

    // Batch insert in chunks of NOTIFICATION_BATCH_SIZE
    const chunks: typeof notifications[] = [];
    for (let i = 0; i < notifications.length; i += NOTIFICATION_BATCH_SIZE) {
      chunks.push(notifications.slice(i, i + NOTIFICATION_BATCH_SIZE));
    }

    // Fire-and-forget: do not await all chunks to avoid timeout
    void (async () => {
      for (const chunk of chunks) {
        await supabase.from("notifications").insert(chunk);
      }
    })();
  }

  return apiSuccess(publishedChapter);
}
