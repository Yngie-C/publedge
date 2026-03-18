import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("purchases")
    .select(`
      id, user_id, book_id, price_paid, payment_method, status, purchased_at, created_at,
      books (
        id, title, description, cover_image_url, language, status, visibility,
        total_chapters, total_words, owner_id,
        user_profiles!owner_id ( display_name )
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("purchased_at", { ascending: false });

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  // Flatten author name
  const purchases = (data ?? []).map((p) => {
    const book = p.books as unknown as Record<string, unknown> | null;
    if (book) {
      const profiles = book.user_profiles as
        | { display_name: string | null }
        | { display_name: string | null }[]
        | null;
      const authorName = Array.isArray(profiles)
        ? profiles[0]?.display_name ?? null
        : (profiles as { display_name: string | null } | null)?.display_name ?? null;
      const { user_profiles: _p, ...bookRest } = book as Record<string, unknown> & { user_profiles: unknown };
      return { ...p, books: { ...bookRest, author_name: authorName } };
    }
    return p;
  });

  return apiSuccess(purchases);
}
