import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { reviewId } = await params;

  let body: { rating?: number; title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { rating, title, content } = body;

  if (
    rating !== undefined &&
    (typeof rating !== "number" || rating < 1 || rating > 5)
  ) {
    return apiError(
      "rating must be a number between 1 and 5",
      "VALIDATION_ERROR",
      400,
    );
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("reviews")
    .select("id, user_id")
    .eq("id", reviewId)
    .single();

  if (fetchError || !existing) {
    return apiError("Review not found", "NOT_FOUND", 404);
  }
  if (existing.user_id !== user.id) {
    return apiError("Forbidden", "FORBIDDEN", 403);
  }

  const updates: Record<string, unknown> = {};
  if (rating !== undefined) updates.rating = rating;
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const { data, error } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", reviewId)
    .select(
      `
      *,
      user_profile:user_profiles!user_id(display_name, avatar_url)
    `,
    )
    .single();

  if (error || !data) {
    return apiError(error?.message ?? "Failed to update review", "SERVER_ERROR", 500);
  }

  return apiSuccess(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { reviewId } = await params;

  const supabase = await createClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("reviews")
    .select("id, user_id")
    .eq("id", reviewId)
    .single();

  if (fetchError || !existing) {
    return apiError("Review not found", "NOT_FOUND", 404);
  }
  if (existing.user_id !== user.id) {
    return apiError("Forbidden", "FORBIDDEN", 403);
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ deleted: true });
}
