import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  const chapterId = searchParams.get("chapterId");

  if (!bookId) return apiError("bookId query parameter is required", "VALIDATION_ERROR", 400);

  const supabase = await createClient();
  let query = supabase
    .from("highlights")
    .select("*")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (chapterId) query = query.eq("chapter_id", chapterId);

  const { data, error } = await query;
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data ?? []);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: {
    book_id?: string;
    chapter_id?: string;
    selected_text?: string;
    prefix_context?: string;
    suffix_context?: string;
    note?: string;
    color?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { book_id, chapter_id, selected_text, prefix_context, suffix_context, note, color } = body;

  if (!book_id || typeof book_id !== "string") {
    return apiError("book_id is required", "VALIDATION_ERROR", 400);
  }
  if (!chapter_id || typeof chapter_id !== "string") {
    return apiError("chapter_id is required", "VALIDATION_ERROR", 400);
  }
  if (!selected_text || typeof selected_text !== "string" || selected_text.trim() === "") {
    return apiError("selected_text is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .insert({
      user_id: user.id,
      book_id,
      chapter_id,
      selected_text: selected_text.trim(),
      prefix_context: prefix_context ?? null,
      suffix_context: suffix_context ?? null,
      note: note ?? null,
      color: color ?? "yellow",
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
    .from("highlights")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return apiError("Highlight not found", "NOT_FOUND", 404);
  if (existing.user_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ deleted: true });
}
