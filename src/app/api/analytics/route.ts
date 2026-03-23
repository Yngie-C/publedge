import { NextRequest } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

type Period = "7d" | "30d" | "all";

function getPeriodStart(period: Period): string | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : 30;
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get("period") ?? "30d";
  const period: Period = (["7d", "30d", "all"].includes(periodParam)
    ? periodParam
    : "30d") as Period;

  const supabase = await createClient();
  const periodStart = getPeriodStart(period);

  // Fetch user's books
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, title, total_chapters, total_words, status, visibility, created_at, content_type")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (booksError) {
    return apiError("Failed to fetch books", "SERVER_ERROR", 500);
  }

  const bookIds = (books ?? []).map((b) => b.id);

  // Overview stats
  const totalBooks = bookIds.length;
  const totalChapters = (books ?? []).reduce(
    (sum, b) => sum + (b.total_chapters ?? 0),
    0,
  );
  const totalWords = (books ?? []).reduce(
    (sum, b) => sum + (b.total_words ?? 0),
    0,
  );

  // Reading progress across all books
  let readersQuery = supabase
    .from("reading_progress")
    .select("user_id, book_id, percentage, last_read_at", { count: "exact" })
    .in("book_id", bookIds.length > 0 ? bookIds : ["__none__"]);

  if (periodStart) {
    readersQuery = readersQuery.gte("last_read_at", periodStart);
  }

  const { data: readingProgress } = await readersQuery;

  const uniqueReaders = new Set(
    (readingProgress ?? []).map((r) => r.user_id),
  ).size;

  // Per-book stats
  const bookStats = (books ?? []).map((book) => {
    const bookProgress = (readingProgress ?? []).filter(
      (r) => r.book_id === book.id,
    );
    const uniqueBookReaders = new Set(bookProgress.map((r) => r.user_id)).size;
    const avgCompletion =
      bookProgress.length > 0
        ? Math.round(
            bookProgress.reduce((sum, r) => sum + (r.percentage ?? 0), 0) /
              bookProgress.length,
          )
        : 0;

    return {
      id: book.id,
      title: book.title,
      status: book.status,
      content_type: book.content_type,
      total_chapters: book.total_chapters,
      total_words: book.total_words,
      readers: uniqueBookReaders,
      views: uniqueBookReaders, // views approximated by readers
      avg_completion: avgCompletion,
    };
  });

  // Popular highlights
  let highlightsQuery = supabase
    .from("highlights")
    .select("selected_text, book_id, created_at")
    .in("book_id", bookIds.length > 0 ? bookIds : ["__none__"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (periodStart) {
    highlightsQuery = highlightsQuery.gte("created_at", periodStart);
  }

  const { data: highlights } = await highlightsQuery;

  // Reading timeline for chart (group by day)
  const timeline: Array<{ date: string; readers: number }> = [];
  if (readingProgress && readingProgress.length > 0) {
    const byDay: Record<string, Set<string>> = {};
    for (const rp of readingProgress) {
      const day = rp.last_read_at?.slice(0, 10);
      if (!day) continue;
      if (!byDay[day]) byDay[day] = new Set();
      byDay[day].add(rp.user_id);
    }
    const sortedDays = Object.keys(byDay).sort();
    for (const day of sortedDays) {
      timeline.push({ date: day, readers: byDay[day].size });
    }
  }

  return apiSuccess({
    overview: {
      total_books: totalBooks,
      total_chapters: totalChapters,
      total_words: totalWords,
      total_readers: uniqueReaders,
    },
    books: bookStats,
    highlights: (highlights ?? []).map((h) => ({
      text: h.selected_text,
      book_id: h.book_id,
      created_at: h.created_at,
    })),
    timeline,
    period,
  });
}
