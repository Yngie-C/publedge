import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  const sort = searchParams.get("sort") ?? "newest";

  if (!bookId) {
    return apiError("bookId is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  let query = supabase
    .from("reviews")
    .select(
      `
      *,
      user_profile:user_profiles!user_id(display_name, avatar_url)
    `,
    )
    .eq("book_id", bookId);

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "rating_high") {
    query = query.order("rating", { ascending: false });
  } else if (sort === "rating_low") {
    query = query.order("rating", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data ?? []);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: {
    book_id?: string;
    rating?: number;
    title?: string;
    content?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { book_id, rating, title, content } = body;

  if (!book_id || typeof book_id !== "string") {
    return apiError("book_id is required", "VALIDATION_ERROR", 400);
  }
  if (
    rating === undefined ||
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5
  ) {
    return apiError(
      "rating must be a number between 1 and 5",
      "VALIDATION_ERROR",
      400,
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      book_id,
      rating,
      title: title ?? null,
      content: content ?? null,
    })
    .select(
      `
      *,
      user_profile:user_profiles!user_id(display_name, avatar_url)
    `,
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return apiError(
        "You have already reviewed this book",
        "VALIDATION_ERROR",
        409,
      );
    }
    return apiError(error.message, "SERVER_ERROR", 500);
  }

  return apiSuccess(data, 201);
}
