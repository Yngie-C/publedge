import { createClient } from "@/lib/supabase/server";

export type AccessReason = "owner" | "purchased" | "free" | "none";

export interface BookAccessResult {
  hasAccess: boolean;
  reason: AccessReason;
}

export async function checkBookAccess(
  userId: string | null,
  bookId: string,
): Promise<BookAccessResult> {
  const supabase = await createClient();

  // 1. 책 정보 조회
  const { data: book } = await supabase
    .from("books")
    .select("owner_id, price, status, visibility")
    .eq("id", bookId)
    .single();

  if (!book) {
    return { hasAccess: false, reason: "none" };
  }

  // 2. 소유자 확인
  if (userId && book.owner_id === userId) {
    return { hasAccess: true, reason: "owner" };
  }

  // 3. 비공개/미발행 책은 소유자만 접근
  if (book.status !== "published" || book.visibility !== "public") {
    return { hasAccess: false, reason: "none" };
  }

  // 4. 무료 책
  if (book.price === 0) {
    return { hasAccess: true, reason: "free" };
  }

  // 5. 구매 여부 확인
  if (userId) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("status", "completed")
      .maybeSingle();

    if (purchase) {
      return { hasAccess: true, reason: "purchased" };
    }
  }

  return { hasAccess: false, reason: "none" };
}
