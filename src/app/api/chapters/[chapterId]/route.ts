import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { sanitizeContent } from "@/lib/sanitize";

type Params = { params: Promise<{ chapterId: string }> };

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { chapterId } = await params;
  const supabase = await createClient();

  const { data: chapter, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", chapterId)
    .single();

  if (error || !chapter) return apiError("Chapter not found", "NOT_FOUND", 404);

  // Verify access via book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("owner_id, visibility")
    .eq("id", chapter.book_id)
    .single();

  if (bookError || !book) return apiError("Book not found", "NOT_FOUND", 404);
  if (book.owner_id !== user.id && book.visibility === "private") {
    return apiError("Access denied", "FORBIDDEN", 403);
  }

  return apiSuccess(chapter);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { chapterId } = await params;
  const supabase = await createClient();

  const { data: chapter, error: fetchError } = await supabase
    .from("chapters")
    .select("*, books(owner_id, total_words)")
    .eq("id", chapterId)
    .single();

  if (fetchError || !chapter) return apiError("Chapter not found", "NOT_FOUND", 404);

  const book = chapter.books as { owner_id: string; total_words: number } | null;
  if (!book) return apiError("Book not found", "NOT_FOUND", 404);
  if (book.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  let body: {
    title?: string;
    content_html?: string;
    content_raw?: string;
    order_index?: number;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.order_index !== undefined) updates.order_index = body.order_index;
  if (body.content_raw !== undefined) updates.content_raw = body.content_raw;

  let wordDiff = 0;
  if (body.content_html !== undefined) {
    const sanitized = sanitizeContent(body.content_html);
    const newWordCount = countWords(sanitized);
    wordDiff = newWordCount - (chapter.word_count ?? 0);
    updates.content_html = sanitized;
    updates.word_count = newWordCount;
  }

  if (Object.keys(updates).length === 0) {
    return apiError("No valid fields to update", "VALIDATION_ERROR", 400);
  }

  const { data, error } = await supabase
    .from("chapters")
    .update(updates)
    .eq("id", chapterId)
    .select()
    .single();

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  // Recalculate book total_words if content changed
  if (wordDiff !== 0) {
    await supabase
      .from("books")
      .update({ total_words: Math.max(0, (book.total_words ?? 0) + wordDiff) })
      .eq("id", chapter.book_id);
  }

  return apiSuccess(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { chapterId } = await params;
  const supabase = await createClient();

  const { data: chapter, error: fetchError } = await supabase
    .from("chapters")
    .select("*, books(owner_id, total_chapters)")
    .eq("id", chapterId)
    .single();

  if (fetchError || !chapter) return apiError("Chapter not found", "NOT_FOUND", 404);

  const book = chapter.books as { owner_id: string; total_chapters: number } | null;
  if (!book) return apiError("Book not found", "NOT_FOUND", 404);
  if (book.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  await supabase
    .from("books")
    .update({ total_chapters: Math.max(0, (book.total_chapters ?? 1) - 1) })
    .eq("id", chapter.book_id);

  return apiSuccess({ deleted: true });
}
