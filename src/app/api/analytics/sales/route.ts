import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const supabase = await createClient();

  // 내 책 ID 목록
  const { data: myBooks } = await supabase
    .from("books")
    .select("id, title, price")
    .eq("owner_id", user.id);

  if (!myBooks || myBooks.length === 0) {
    return apiSuccess({
      totalRevenue: 0,
      totalSales: 0,
      bookStats: [],
    });
  }

  const bookIds = myBooks.map((b) => b.id);

  // 내 책들의 구매 기록
  const { data: purchases } = await supabase
    .from("purchases")
    .select("book_id, price_paid")
    .in("book_id", bookIds)
    .eq("status", "completed");

  const purchaseList = purchases ?? [];

  // 책별 통계 계산
  const bookStatsMap = new Map<string, { sales: number; revenue: number }>();
  for (const p of purchaseList) {
    const existing = bookStatsMap.get(p.book_id) ?? { sales: 0, revenue: 0 };
    existing.sales += 1;
    existing.revenue += p.price_paid;
    bookStatsMap.set(p.book_id, existing);
  }

  const bookStats = myBooks.map((book) => {
    const stats = bookStatsMap.get(book.id) ?? { sales: 0, revenue: 0 };
    return {
      bookId: book.id,
      title: book.title,
      price: book.price,
      sales: stats.sales,
      revenue: stats.revenue,
    };
  });

  const totalRevenue = purchaseList.reduce((sum, p) => sum + p.price_paid, 0);
  const totalSales = purchaseList.length;

  return apiSuccess({
    totalRevenue,
    totalSales,
    bookStats,
  });
}
