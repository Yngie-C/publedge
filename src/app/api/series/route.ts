import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import type { BookStatus, BookVisibility } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("owner_id");
  const status = searchParams.get("status") as BookStatus | null;
  const visibility = searchParams.get("visibility") as BookVisibility | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("books")
    .select(
      `
      *,
      series_metadata (
        series_status,
        schedule_day,
        schedule_description,
        last_chapter_published_at
      )
    `,
    )
    .eq("content_type", "series")
    .order("updated_at", { ascending: false });

  if (ownerId) {
    // Requesting a specific creator's series
    query = query.eq("owner_id", ownerId);
    // Non-owners can only see published public series
    if (!user || user.id !== ownerId) {
      query = query.eq("status", "published").eq("visibility", "public");
    }
  } else if (user) {
    // Authenticated user sees their own series
    query = query.eq("owner_id", user.id);
  } else {
    // Anonymous: public published series only
    query = query.eq("status", "published").eq("visibility", "public");
  }

  if (status) query = query.eq("status", status);
  if (visibility) query = query.eq("visibility", visibility);

  const { data: series, error } = await query;
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  // Attach published chapter counts
  if (!series || series.length === 0) return apiSuccess([]);

  const seriesIds = series.map((s) => s.id);
  const { data: chapterCounts, error: countError } = await supabase
    .from("chapters")
    .select("book_id")
    .in("book_id", seriesIds)
    .eq("status", "published");

  if (countError) return apiError(countError.message, "SERVER_ERROR", 500);

  const countMap: Record<string, number> = {};
  for (const row of chapterCounts ?? []) {
    countMap[row.book_id] = (countMap[row.book_id] ?? 0) + 1;
  }

  const result = series.map((s) => ({
    ...s,
    published_chapter_count: countMap[s.id] ?? 0,
  }));

  return apiSuccess(result);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: {
    title?: string;
    description?: string;
    cover_image_url?: string;
    price?: number;
    language?: string;
    series_status?: "ongoing" | "hiatus" | "completed";
    schedule_day?: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
    schedule_description?: string;
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
    series_status,
    schedule_day,
    schedule_description,
  } = body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return apiError("title is required", "VALIDATION_ERROR", 400);
  }

  const validSeriesStatuses = ["ongoing", "hiatus", "completed"];
  if (series_status && !validSeriesStatuses.includes(series_status)) {
    return apiError(
      "series_status must be one of: ongoing, hiatus, completed",
      "VALIDATION_ERROR",
      400,
    );
  }

  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  if (schedule_day && !validDays.includes(schedule_day)) {
    return apiError(
      "schedule_day must be one of: mon, tue, wed, thu, fri, sat, sun",
      "VALIDATION_ERROR",
      400,
    );
  }

  const supabase = await createClient();

  // Create books row with content_type='series'
  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      owner_id: user.id,
      title: title.trim(),
      description: description ?? null,
      cover_image_url: cover_image_url ?? null,
      language: language ?? "ko",
      source_type: "text",
      status: "draft",
      visibility: "private",
      price: typeof price === "number" && price >= 0 ? price : 0,
      content_type: "series",
    })
    .select()
    .single();

  if (bookError) return apiError(bookError.message, "SERVER_ERROR", 500);

  // Create series_metadata row
  const { data: metadata, error: metaError } = await supabase
    .from("series_metadata")
    .insert({
      book_id: book.id,
      series_status: series_status ?? "ongoing",
      schedule_day: schedule_day ?? null,
      schedule_description: schedule_description ?? null,
    })
    .select()
    .single();

  if (metaError) {
    // Rollback book on metadata failure
    await supabase.from("books").delete().eq("id", book.id);
    return apiError(metaError.message, "SERVER_ERROR", 500);
  }

  return apiSuccess({ ...book, series_metadata: metadata }, 201);
}
