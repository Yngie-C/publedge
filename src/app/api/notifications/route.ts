import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread_only") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: notifications, error } = await query;
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  // Unread count (always compute regardless of filter)
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return apiSuccess({
    notifications: notifications ?? [],
    unread_count: unreadCount ?? 0,
    limit,
    offset,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { notification_ids?: string[]; mark_all_read?: boolean };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { notification_ids, mark_all_read } = body;

  if (!mark_all_read && (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0)) {
    return apiError(
      "Either notification_ids (non-empty array) or mark_all_read: true is required",
      "VALIDATION_ERROR",
      400,
    );
  }

  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id);

  if (!mark_all_read && notification_ids) {
    query = query.in("id", notification_ids);
  }

  const { error } = await query;
  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ marked_read: true });
}
