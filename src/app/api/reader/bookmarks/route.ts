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
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data ?? []);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: {
    book_id?: string;
    chapter_id?: string;
    page_number?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { book_id, chapter_id, page_number, note } = body;

  if (!book_id || typeof book_id !== "string") {
    return apiError("book_id is required", "VALIDATION_ERROR", 400);
  }
  if (!chapter_id || typeof chapter_id !== "string") {
    return apiError("chapter_id is required", "VALIDATION_ERROR", 400);
  }
  if (page_number === undefined || typeof page_number !== "number" || page_number < 1) {
    return apiError("page_number must be a positive number", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      book_id,
      chapter_id,
      page_number,
      note: note ?? null,
    })
    .select()
    .single();

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data, 201);
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return apiError("id query parameter is required", "VALIDATION_ERROR", 400);

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("bookmarks")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return apiError("Bookmark not found", "NOT_FOUND", 404);
  if (existing.user_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  const { error } = await supabase.from("bookmarks").delete().eq("id", id);
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ deleted: true });
}
