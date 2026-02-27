import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("targetUserId");

  if (!targetUserId) {
    return apiError("targetUserId is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  // Check if current user follows the target
  const { data: followRow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  // Count followers of the target
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", targetUserId);

  return apiSuccess({
    isFollowing: !!followRow,
    followerCount: count ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { following_id?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { following_id } = body;

  if (!following_id || typeof following_id !== "string") {
    return apiError("following_id is required", "VALIDATION_ERROR", 400);
  }

  if (following_id === user.id) {
    return apiError("Cannot follow yourself", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return apiError("Already following this user", "VALIDATION_ERROR", 409);
    }
    return apiError(error.message, "SERVER_ERROR", 500);
  }

  return apiSuccess(data, 201);
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { following_id?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { following_id } = body;

  if (!following_id || typeof following_id !== "string") {
    return apiError("following_id is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", following_id);

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ deleted: true });
}
