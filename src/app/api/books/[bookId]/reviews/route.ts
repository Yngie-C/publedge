import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id, user_id, book_id, rating, content, created_at,
      user_profiles!user_id ( display_name )
    `,
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  const reviews = (data ?? []).map((r) => {
    const rp = r.user_profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;
    const reviewerName = Array.isArray(rp)
      ? rp[0]?.display_name ?? null
      : rp?.display_name ?? null;
    const { user_profiles: _rp, ...rest } = r;
    return { ...rest, reviewer_name: reviewerName };
  });

  return apiSuccess(reviews);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid JSON", "VALIDATION_ERROR", 400);

  const { rating, content } = body as { rating?: number; content?: string };

  if (
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5 ||
    !Number.isInteger(rating)
  ) {
    return apiError(
      "rating must be an integer between 1 and 5",
      "VALIDATION_ERROR",
      400,
    );
  }

  const supabase = await createClient();

  // Verify book exists and is accessible
  const { data: book } = await supabase
    .from("books")
    .select("id, owner_id, status, visibility")
    .eq("id", bookId)
    .single();

  if (!book) return apiError("Book not found", "NOT_FOUND", 404);

  // Owners cannot review their own books
  if (book.owner_id === user.id) {
    return apiError(
      "Cannot review your own book",
      "VALIDATION_ERROR",
      400,
    );
  }

  // Upsert review (one per user per book)
  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id: user.id,
        book_id: bookId,
        rating,
        content: content?.trim() || null,
      },
      { onConflict: "user_id,book_id" },
    )
    .select()
    .single();

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data, 201);
}
