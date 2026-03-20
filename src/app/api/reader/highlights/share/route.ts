import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { highlight_id?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { highlight_id } = body;
  if (!highlight_id) return apiError("highlight_id is required", "VALIDATION_ERROR", 400);

  const supabase = await createClient();

  // 하이라이트 소유권 확인
  const { data: highlight, error: fetchError } = await supabase
    .from("highlights")
    .select("id, share_token, is_public")
    .eq("id", highlight_id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !highlight) return apiError("Highlight not found", "NOT_FOUND", 404);

  // 이미 공유된 경우 기존 토큰 반환
  if (highlight.share_token && highlight.is_public) {
    return apiSuccess({ share_token: highlight.share_token });
  }

  // 이미 토큰이 있으나 is_public=false인 경우 (공유 취소 후 재공유)
  if (highlight.share_token) {
    const { error: updateError } = await supabase
      .from("highlights")
      .update({ is_public: true, shared_at: new Date().toISOString() })
      .eq("id", highlight_id);

    if (updateError) return apiError(updateError.message, "SERVER_ERROR", 500);
    return apiSuccess({ share_token: highlight.share_token });
  }

  // 새 share_token 생성 (충돌 시 최대 3회 재시도)
  let retries = 3;
  while (retries > 0) {
    const token = nanoid(21);
    const { error: updateError } = await supabase
      .from("highlights")
      .update({
        share_token: token,
        is_public: true,
        shared_at: new Date().toISOString(),
      })
      .eq("id", highlight_id);

    if (!updateError) {
      return apiSuccess({ share_token: token }, 201);
    }

    // UNIQUE 위반이 아닌 에러는 즉시 반환
    if (!updateError.message.includes("unique") && !updateError.message.includes("duplicate")) {
      return apiError(updateError.message, "SERVER_ERROR", 500);
    }

    retries--;
  }

  return apiError("Failed to generate unique share token", "SERVER_ERROR", 500);
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { searchParams } = new URL(request.url);
  const highlightId = searchParams.get("highlight_id");

  if (!highlightId) return apiError("highlight_id is required", "VALIDATION_ERROR", 400);

  const supabase = await createClient();

  // 소유권 확인
  const { data: highlight, error: fetchError } = await supabase
    .from("highlights")
    .select("user_id")
    .eq("id", highlightId)
    .single();

  if (fetchError || !highlight) return apiError("Highlight not found", "NOT_FOUND", 404);
  if (highlight.user_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  // is_public=false로 전환 (토큰 유지)
  const { error } = await supabase
    .from("highlights")
    .update({ is_public: false })
    .eq("id", highlightId);

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ unshared: true });
}
