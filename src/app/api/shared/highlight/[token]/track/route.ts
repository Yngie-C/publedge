import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api-utils";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) return apiError("Token is required", "VALIDATION_ERROR", 400);

  let body: { platform?: string; referrer?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { platform, referrer } = body;

  if (!platform || typeof platform !== "string") {
    return apiError("platform is required", "VALIDATION_ERROR", 400);
  }

  const validPlatforms = ["kakao", "twitter", "instagram", "link_copy"];
  if (!validPlatforms.includes(platform)) {
    return apiError(
      `Invalid platform. Must be one of: ${validPlatforms.join(", ")}`,
      "VALIDATION_ERROR",
      400
    );
  }

  const supabase = createAdminClient();

  // 하이라이트 존재 + 공개 확인
  const { data: highlight, error: fetchError } = await supabase
    .from("highlights")
    .select("id")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (fetchError || !highlight) {
    return apiError("Shared highlight not found", "NOT_FOUND", 404);
  }

  // IP 해시 생성 (익명 집계용)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const viewerIpHash = crypto
    .createHash("sha256")
    .update(ip + process.env.SUPABASE_SECRET_KEY)
    .digest("hex")
    .slice(0, 16);

  // 공유 이벤트 기록
  const { error: insertError } = await supabase
    .from("highlight_share_events")
    .insert({
      highlight_id: highlight.id,
      platform,
      referrer: referrer ?? null,
      viewer_ip_hash: viewerIpHash,
    });

  if (insertError) return apiError(insertError.message, "SERVER_ERROR", 500);

  return apiSuccess({ tracked: true }, 201);
}
