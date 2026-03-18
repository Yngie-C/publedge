import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api-utils";

export const revalidate = 300;

interface BookWithAuthor {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  language: string | null;
  status: string;
  visibility: string;
  total_chapters: number | null;
  total_words: number | null;
  published_at: string | null;
  price: number;
  owner_id: string;
  author_name: string | null;
}

interface ReviewWithBook {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  book_title: string;
  book_id: string;
  user_name: string;
  avatar_url: string | null;
}

const BOOK_SELECT =
  "id, title, description, cover_image_url, language, status, visibility, total_chapters, total_words, published_at, price, owner_id, user_profiles!owner_id(display_name)";

function flattenBookAuthor(b: Record<string, unknown>): BookWithAuthor {
  const profiles = b.user_profiles as
    | { display_name: string | null }
    | { display_name: string | null }[]
    | null;
  const authorName = Array.isArray(profiles)
    ? (profiles[0]?.display_name ?? null)
    : (profiles?.display_name ?? null);
  const { user_profiles: _profiles, ...rest } = b;
  return {
    ...(rest as Omit<BookWithAuthor, "author_name">),
    author_name: authorName,
    language: (rest.language as string | null) ?? "ko",
    total_chapters: (rest.total_chapters as number | null) ?? 0,
    total_words: (rest.total_words as number | null) ?? 0,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const admin = createAdminClient();

    const [
      purchasesResult,
      newestResult,
      freeResult,
      reviewsResult,
      totalBooksResult,
      authorsResult,
      totalReviewsResult,
    ] = await Promise.all([
      // 1. Purchase counts for featured
      admin.from("purchases").select("book_id").eq("status", "completed"),
      // 2. Newest books
      admin
        .from("books")
        .select(BOOK_SELECT)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("published_at", { ascending: false })
        .limit(8),
      // 3. Free books
      admin
        .from("books")
        .select(BOOK_SELECT)
        .eq("status", "published")
        .eq("visibility", "public")
        .eq("price", 0)
        .order("published_at", { ascending: false })
        .limit(8),
      // 4. Recent reviews
      admin
        .from("reviews")
        .select(
          "id, rating, title, content, created_at, user_profiles:user_id(display_name, avatar_url), books:book_id(id, title)",
        )
        .order("created_at", { ascending: false })
        .limit(4),
      // 5a. Total published books count
      admin
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .eq("visibility", "public"),
      // 5b. All owner_ids for unique author count
      admin
        .from("books")
        .select("owner_id")
        .eq("status", "published")
        .eq("visibility", "public"),
      // 5c. Total reviews count
      admin.from("reviews").select("id", { count: "exact", head: true }),
    ]);

    // --- Featured: derive from purchase counts ---
    let featured: BookWithAuthor[] = [];
    {
      const purchases = purchasesResult.data ?? [];
      let topBookIds: string[] = [];

      if (purchases.length > 0) {
        // Count per book_id
        const countMap: Record<string, number> = {};
        for (const p of purchases) {
          const bid = p.book_id as string;
          countMap[bid] = (countMap[bid] ?? 0) + 1;
        }
        topBookIds = Object.entries(countMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([id]) => id);

        const { data: featuredData } = await admin
          .from("books")
          .select(BOOK_SELECT)
          .in("id", topBookIds)
          .eq("status", "published")
          .eq("visibility", "public");

        featured = (featuredData ?? []).map((b) =>
          flattenBookAuthor(b as Record<string, unknown>),
        );
      } else {
        // Fallback: top 8 by total_words DESC
        const { data: fallbackData } = await admin
          .from("books")
          .select(BOOK_SELECT)
          .eq("status", "published")
          .eq("visibility", "public")
          .order("total_words", { ascending: false })
          .limit(8);

        featured = (fallbackData ?? []).map((b) =>
          flattenBookAuthor(b as Record<string, unknown>),
        );
      }
    }

    // --- Newest ---
    const newest: BookWithAuthor[] = (newestResult.data ?? []).map((b) =>
      flattenBookAuthor(b as Record<string, unknown>),
    );

    // --- Free ---
    const free: BookWithAuthor[] = (freeResult.data ?? []).map((b) =>
      flattenBookAuthor(b as Record<string, unknown>),
    );

    // --- Recent reviews ---
    const recentReviews: ReviewWithBook[] = (reviewsResult.data ?? []).map((r) => {
      const raw = r as Record<string, unknown>;
      const userProfiles = raw.user_profiles as
        | { display_name: string | null; avatar_url: string | null }
        | { display_name: string | null; avatar_url: string | null }[]
        | null;
      const bookInfo = raw.books as
        | { id: string; title: string }
        | { id: string; title: string }[]
        | null;

      const profile = Array.isArray(userProfiles) ? userProfiles[0] : userProfiles;
      const book = Array.isArray(bookInfo) ? bookInfo[0] : bookInfo;

      return {
        id: raw.id as string,
        rating: raw.rating as number,
        title: raw.title as string | null,
        content: raw.content as string | null,
        created_at: raw.created_at as string,
        book_title: book?.title ?? "",
        book_id: book?.id ?? "",
        user_name: profile?.display_name ?? "익명",
        avatar_url: profile?.avatar_url ?? null,
      };
    });

    // --- Stats ---
    const totalBooks = totalBooksResult.count ?? 0;
    const ownerIds = (authorsResult.data ?? []).map(
      (r) => (r as Record<string, unknown>).owner_id as string,
    );
    const totalAuthors = new Set(ownerIds).size;
    const totalReviews = totalReviewsResult.count ?? 0;

    return apiSuccess({
      featured,
      newest,
      free,
      recentReviews,
      stats: { totalBooks, totalAuthors, totalReviews },
    });
  } catch (err) {
    console.error("[landing/route] error:", err);
    return apiError("랜딩 데이터를 불러오는 중 오류가 발생했습니다.", "SERVER_ERROR", 500);
  }
}
