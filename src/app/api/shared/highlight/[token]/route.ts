import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) return apiError("Token is required", "VALIDATION_ERROR", 400);

  const supabase = createAdminClient();

  // createAdminClient() 사용 (RLS 우회) + is_public=true 방어적 필터
  const { data: highlight, error } = await supabase
    .from("highlights")
    .select(`
      id,
      selected_text,
      color,
      chapter_id,
      book_id,
      share_token,
      is_public,
      shared_at,
      created_at
    `)
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (error || !highlight) {
    return apiError("Shared highlight not found", "NOT_FOUND", 404);
  }

  // 책 + 저자 정보 조회
  const { data: book } = await supabase
    .from("books")
    .select(`
      id,
      title,
      cover_image_url,
      owner_id
    `)
    .eq("id", highlight.book_id)
    .single();

  let owner = null;
  if (book) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, avatar_url")
      .eq("user_id", book.owner_id)
      .single();

    owner = profile;
  }

  return apiSuccess({
    highlight: {
      id: highlight.id,
      selected_text: highlight.selected_text,
      color: highlight.color,
      chapter_id: highlight.chapter_id,
      share_token: highlight.share_token,
      shared_at: highlight.shared_at,
      created_at: highlight.created_at,
    },
    book: book
      ? {
          id: book.id,
          title: book.title,
          cover_image_url: book.cover_image_url,
          owner: owner
            ? {
                display_name: owner.display_name,
                avatar_url: owner.avatar_url,
              }
            : { display_name: "Unknown", avatar_url: null },
        }
      : null,
  });
}
