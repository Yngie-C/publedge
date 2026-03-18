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
  "id, title, description, cover_image_url, language, status, visibility, total_chapters, total_words, published_at, price, owner_id";

async function fetchAuthorMap(
  admin: ReturnType<typeof createAdminClient>,
  books: Record<string, unknown>[],
): Promise<Map<string, string | null>> {
  const ownerIds = [...new Set(books.map((b) => b.owner_id as string))];
  const map = new Map<string, string | null>();
  if (ownerIds.length === 0) return map;

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("user_id, display_name")
    .in("user_id", ownerIds);

  for (const p of (profiles ?? [])) {
    map.set(p.user_id as string, p.display_name as string | null);
  }
  return map;
}

function toBookWithAuthor(
  b: Record<string, unknown>,
  authorMap: Map<string, string | null>,
): BookWithAuthor {
  return {
    ...(b as Omit<BookWithAuthor, "author_name">),
    author_name: authorMap.get(b.owner_id as string) ?? null,
    language: (b.language as string | null) ?? "ko",
    total_chapters: (b.total_chapters as number | null) ?? 0,
    total_words: (b.total_words as number | null) ?? 0,
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
        .select("id, user_id, book_id, rating, title, content, created_at")
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

    // --- Collect all books for batch author lookup ---
    const allRawBooks: Record<string, unknown>[] = [
      ...((newestResult.data ?? []) as Record<string, unknown>[]),
      ...((freeResult.data ?? []) as Record<string, unknown>[]),
    ];

    // --- Featured: derive from purchase counts ---
    let featuredRaw: Record<string, unknown>[] = [];
    {
      const purchases = purchasesResult.data ?? [];

      if (purchases.length > 0) {
        const countMap: Record<string, number> = {};
        for (const p of purchases) {
          const bid = p.book_id as string;
          countMap[bid] = (countMap[bid] ?? 0) + 1;
        }
        const topBookIds = Object.entries(countMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([id]) => id);

        const { data: featuredData } = await admin
          .from("books")
          .select(BOOK_SELECT)
          .in("id", topBookIds)
          .eq("status", "published")
          .eq("visibility", "public");

        featuredRaw = (featuredData ?? []) as Record<string, unknown>[];
      } else {
        const { data: fallbackData } = await admin
          .from("books")
          .select(BOOK_SELECT)
          .eq("status", "published")
          .eq("visibility", "public")
          .order("total_words", { ascending: false })
          .limit(8);

        featuredRaw = (fallbackData ?? []) as Record<string, unknown>[];
      }
    }
    allRawBooks.push(...featuredRaw);

    // --- Batch fetch author names ---
    const authorMap = await fetchAuthorMap(admin, allRawBooks);

    // --- Map to BookWithAuthor ---
    const featured = featuredRaw.map((b) => toBookWithAuthor(b, authorMap));
    const newest = ((newestResult.data ?? []) as Record<string, unknown>[]).map(
      (b) => toBookWithAuthor(b, authorMap),
    );
    const free = ((freeResult.data ?? []) as Record<string, unknown>[]).map(
      (b) => toBookWithAuthor(b, authorMap),
    );

    // --- Recent reviews: fetch user profiles and book titles separately ---
    const rawReviews = (reviewsResult.data ?? []) as Record<string, unknown>[];
    let recentReviews: ReviewWithBook[] = [];

    if (rawReviews.length > 0) {
      const reviewUserIds = [...new Set(rawReviews.map((r) => r.user_id as string))];
      const reviewBookIds = [...new Set(rawReviews.map((r) => r.book_id as string))];

      const [reviewProfiles, reviewBooks] = await Promise.all([
        admin.from("user_profiles").select("user_id, display_name, avatar_url").in("user_id", reviewUserIds),
        admin.from("books").select("id, title").in("id", reviewBookIds),
      ]);

      const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      for (const p of (reviewProfiles.data ?? [])) {
        profileMap.set(p.user_id as string, {
          display_name: p.display_name as string | null,
          avatar_url: p.avatar_url as string | null,
        });
      }

      const bookMap = new Map<string, { id: string; title: string }>();
      for (const b of (reviewBooks.data ?? [])) {
        bookMap.set(b.id as string, { id: b.id as string, title: b.title as string });
      }

      recentReviews = rawReviews.map((r) => {
        const profile = profileMap.get(r.user_id as string);
        const book = bookMap.get(r.book_id as string);
        return {
          id: r.id as string,
          rating: r.rating as number,
          title: r.title as string | null,
          content: r.content as string | null,
          created_at: r.created_at as string,
          book_title: book?.title ?? "",
          book_id: book?.id ?? "",
          user_name: profile?.display_name ?? "익명",
          avatar_url: profile?.avatar_url ?? null,
        };
      });
    }

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
