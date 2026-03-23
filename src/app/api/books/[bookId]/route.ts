import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import type { BookStatus, BookVisibility } from "@/types";

type Params = { params: Promise<{ bookId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;
  const supabase = await createClient();

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookError || !book) return apiError("Book not found", "NOT_FOUND", 404);
  if (book.owner_id !== user.id && book.visibility === "private") {
    return apiError("Access denied", "FORBIDDEN", 403);
  }

  const isOwner = book.owner_id === user.id;
  let chaptersQuery = supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });

  if (!isOwner) {
    chaptersQuery = chaptersQuery.eq("status", "published");
  }

  const { data: chapters, error: chaptersError } = await chaptersQuery;

  if (chaptersError) return apiError(chaptersError.message, "SERVER_ERROR", 500);

  return apiSuccess({ ...book, chapters: chapters ?? [] });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("books")
    .select("owner_id")
    .eq("id", bookId)
    .single();

  if (fetchError || !existing) return apiError("Book not found", "NOT_FOUND", 404);
  if (existing.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  let body: {
    title?: string;
    description?: string;
    language?: string;
    status?: BookStatus;
    visibility?: BookVisibility;
    cover_image_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const allowedFields: (keyof typeof body)[] = [
    "title",
    "description",
    "language",
    "status",
    "visibility",
    "cover_image_url",
  ];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return apiError("No valid fields to update", "VALIDATION_ERROR", 400);
  }

  const { data, error } = await supabase
    .from("books")
    .update(updates)
    .eq("id", bookId)
    .select()
    .single();

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("books")
    .select("owner_id")
    .eq("id", bookId)
    .single();

  if (fetchError || !existing) return apiError("Book not found", "NOT_FOUND", 404);
  if (existing.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  // Cascade: delete chapters first
  await supabase.from("chapters").delete().eq("book_id", bookId);

  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ deleted: true });
}
