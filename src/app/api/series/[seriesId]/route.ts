import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const { seriesId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: series, error } = await supabase
    .from("books")
    .select(
      `
      *,
      series_metadata (
        series_status,
        schedule_day,
        schedule_description,
        last_chapter_published_at,
        created_at,
        updated_at
      )
    `,
    )
    .eq("id", seriesId)
    .eq("content_type", "series")
    .single();

  if (error || !series) return apiError("Series not found", "NOT_FOUND", 404);

  const isOwner = user?.id === series.owner_id;

  // Non-owners can only see published public series
  if (!isOwner && (series.status !== "published" || series.visibility !== "public")) {
    return apiError("Series not found", "NOT_FOUND", 404);
  }

  // Published chapter count
  const { count: publishedChapterCount } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("book_id", seriesId)
    .eq("status", "published");

  // Subscriber count
  const { count: subscriberCount } = await supabase
    .from("series_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("series_id", seriesId);

  // User's subscription status (if authenticated)
  let isSubscribed = false;
  if (user && !isOwner) {
    const { data: sub } = await supabase
      .from("series_subscriptions")
      .select("id")
      .eq("series_id", seriesId)
      .eq("user_id", user.id)
      .single();
    isSubscribed = !!sub;
  }

  return apiSuccess({
    ...series,
    published_chapter_count: publishedChapterCount ?? 0,
    subscriber_count: subscriberCount ?? 0,
    is_subscribed: isSubscribed,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const { seriesId } = await params;

  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  // Verify ownership
  const supabase = await createClient();
  const { data: series, error: fetchError } = await supabase
    .from("books")
    .select("owner_id")
    .eq("id", seriesId)
    .eq("content_type", "series")
    .single();

  if (fetchError || !series) return apiError("Series not found", "NOT_FOUND", 404);
  if (series.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  let body: {
    title?: string;
    description?: string;
    cover_image_url?: string;
    price?: number;
    language?: string;
    status?: string;
    visibility?: string;
    series_status?: "ongoing" | "hiatus" | "completed";
    schedule_day?: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" | null;
    schedule_description?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const {
    title,
    description,
    cover_image_url,
    price,
    language,
    status,
    visibility,
    series_status,
    schedule_day,
    schedule_description,
  } = body;

  // Build books update payload
  const bookUpdates: Record<string, unknown> = {};
  if (title !== undefined) bookUpdates.title = title?.trim();
  if (description !== undefined) bookUpdates.description = description;
  if (cover_image_url !== undefined) bookUpdates.cover_image_url = cover_image_url;
  if (price !== undefined && typeof price === "number" && price >= 0)
    bookUpdates.price = price;
  if (language !== undefined) bookUpdates.language = language;
  if (status !== undefined) bookUpdates.status = status;
  if (visibility !== undefined) bookUpdates.visibility = visibility;

  // Build series_metadata update payload
  const metaUpdates: Record<string, unknown> = {};
  if (series_status !== undefined) metaUpdates.series_status = series_status;
  if (schedule_day !== undefined) metaUpdates.schedule_day = schedule_day;
  if (schedule_description !== undefined)
    metaUpdates.schedule_description = schedule_description;

  let updatedBook = null;
  let updatedMeta = null;

  if (Object.keys(bookUpdates).length > 0) {
    const { data, error } = await supabase
      .from("books")
      .update(bookUpdates)
      .eq("id", seriesId)
      .select()
      .single();
    if (error) return apiError(error.message, "SERVER_ERROR", 500);
    updatedBook = data;
  }

  if (Object.keys(metaUpdates).length > 0) {
    const { data, error } = await supabase
      .from("series_metadata")
      .update(metaUpdates)
      .eq("book_id", seriesId)
      .select()
      .single();
    if (error) return apiError(error.message, "SERVER_ERROR", 500);
    updatedMeta = data;
  }

  return apiSuccess({ book: updatedBook, series_metadata: updatedMeta });
}
