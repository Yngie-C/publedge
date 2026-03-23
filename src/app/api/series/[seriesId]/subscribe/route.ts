import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const { seriesId } = await params;

  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const supabase = await createClient();

  // Verify the series exists and is public/published
  const { data: series, error: seriesError } = await supabase
    .from("books")
    .select("id, owner_id, status, visibility")
    .eq("id", seriesId)
    .eq("content_type", "series")
    .single();

  if (seriesError || !series) return apiError("Series not found", "NOT_FOUND", 404);

  if (series.owner_id === user.id) {
    return apiError("Cannot subscribe to your own series", "VALIDATION_ERROR", 400);
  }

  if (series.status !== "published" || series.visibility !== "public") {
    return apiError("Series not found", "NOT_FOUND", 404);
  }

  const { data, error } = await supabase
    .from("series_subscriptions")
    .insert({ user_id: user.id, series_id: seriesId })
    .select()
    .single();

  if (error) {
    // Unique constraint violation: already subscribed
    if (error.code === "23505") {
      return apiError("Already subscribed to this series", "VALIDATION_ERROR", 409);
    }
    return apiError(error.message, "SERVER_ERROR", 500);
  }

  return apiSuccess(data, 201);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const { seriesId } = await params;

  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const supabase = await createClient();

  const { error } = await supabase
    .from("series_subscriptions")
    .delete()
    .eq("series_id", seriesId)
    .eq("user_id", user.id);

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ unsubscribed: true });
}
