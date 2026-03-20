import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) return apiError("bookId is required", "VALIDATION_ERROR", 400);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("highlights")
    .select(`
      id,
      selected_text,
      chapter_id,
      color,
      share_token,
      shared_at,
      highlight_share_events(count)
    `)
    .eq("book_id", bookId)
    .eq("is_public", true)
    .not("share_token", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  // share_events count 기준 정렬
  const sorted = (data ?? [])
    .map((h: Record<string, unknown>) => ({
      ...h,
      share_count: Array.isArray(h.highlight_share_events)
        ? (h.highlight_share_events[0] as { count: number })?.count ?? 0
        : 0,
    }))
    .sort((a: { share_count: number }, b: { share_count: number }) => b.share_count - a.share_count);

  return apiSuccess(sorted);
}
