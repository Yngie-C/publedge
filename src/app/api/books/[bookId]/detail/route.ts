import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  // Fetch book
  const { data: bookData, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookError || !bookData) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }

  // Access control: non-owners can only see published+public books
  const isOwner = user?.id === bookData.owner_id;
  if (
    !isOwner &&
    (bookData.status !== "published" || bookData.visibility !== "public")
  ) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }

  // Fetch author name separately (no FK between books.owner_id and user_profiles.user_id)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", bookData.owner_id)
    .maybeSingle();

  const book = { ...bookData, author_name: profile?.display_name ?? null };

  // Fetch chapters (non-owners only see published chapters)
  let chaptersQuery = supabase
    .from("chapters")
    .select("id, title, slug, order_index, word_count, estimated_reading_time, created_at, updated_at, book_id, status, published_at")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });

  if (!isOwner) {
    chaptersQuery = chaptersQuery.eq("status", "published");
  }

  const { data: chapters } = await chaptersQuery;

  // Fetch series metadata if this is a series
  let seriesMetadata = null;
  let subscriberCount = null;
  if (book.content_type === "series") {
    const { data: smData } = await supabase
      .from("series_metadata")
      .select("*")
      .eq("book_id", bookId)
      .maybeSingle();
    seriesMetadata = smData ?? null;

    const { count } = await supabase
      .from("series_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("book_id", bookId)
      .eq("status", "active");
    subscriberCount = count ?? 0;
  }

  // Fetch user's subscription status if authenticated and this is a series
  let userSubscription = null;
  if (user && book.content_type === "series") {
    const { data: subData } = await supabase
      .from("series_subscriptions")
      .select("id, status, created_at")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .maybeSingle();
    userSubscription = subData ?? null;
  }

  // Fetch audiobook
  const { data: audiobook } = await supabase
    .from("audiobooks")
    .select("*")
    .eq("book_id", bookId)
    .eq("status", "completed")
    .maybeSingle();

  // Fetch reviews with reviewer name
  const { data: reviewsRaw } = await supabase
    .from("reviews")
    .select(
      `
      id, user_id, book_id, rating, content, created_at,
      user_profiles!user_id ( display_name )
    `,
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .limit(50);

  const reviews = (reviewsRaw ?? []).map((r) => {
    const rp = r.user_profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;
    const reviewerName = Array.isArray(rp)
      ? rp[0]?.display_name ?? null
      : rp?.display_name ?? null;
    const { user_profiles: _rp, ...rest } = r;
    return { ...rest, reviewer_name: reviewerName };
  });

  return apiSuccess({
    book,
    chapters: chapters ?? [],
    audiobook: audiobook ?? null,
    reviews,
    series_metadata: seriesMetadata,
    subscriber_count: subscriberCount,
    user_subscription: userSubscription,
  });
}
