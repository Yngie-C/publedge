import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) return apiError("bookId query parameter is required", "VALIDATION_ERROR", 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .single();

  if (error && error.code !== "PGRST116") {
    return apiError(error.message, "SERVER_ERROR", 500);
  }

  return apiSuccess(data ?? null);
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: {
    book_id?: string;
    chapter_id?: string;
    page_number?: number;
    total_pages?: number;
    percentage?: number;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { book_id, chapter_id, page_number, total_pages, percentage } = body;

  if (!book_id || typeof book_id !== "string") {
    return apiError("book_id is required", "VALIDATION_ERROR", 400);
  }
  if (!chapter_id || typeof chapter_id !== "string") {
    return apiError("chapter_id is required", "VALIDATION_ERROR", 400);
  }
  if (page_number === undefined || typeof page_number !== "number" || page_number < 0) {
    return apiError("page_number must be a non-negative number", "VALIDATION_ERROR", 400);
  }
  if (percentage === undefined || typeof percentage !== "number" || percentage < 0 || percentage > 100) {
    return apiError("percentage must be a number between 0 and 100", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_progress")
    .upsert(
      {
        user_id: user.id,
        book_id,
        chapter_id,
        page_number,
        total_pages: total_pages ?? null,
        percentage,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" },
    )
    .select()
    .single();

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data);
}
