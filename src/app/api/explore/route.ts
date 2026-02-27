import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const language = searchParams.get("language") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(
    48,
    Math.max(1, parseInt(searchParams.get("per_page") ?? "24", 10)),
  );
  const offset = (page - 1) * perPage;

  const supabase = await createClient();

  let dbQuery = supabase
    .from("books")
    .select(
      `
      id, title, description, cover_image_url, language,
      status, visibility, total_chapters, total_words,
      published_at, created_at, updated_at, owner_id,
      source_type, source_file_url,
      user_profiles!owner_id ( display_name )
    `,
      { count: "exact" },
    )
    .eq("status", "published")
    .eq("visibility", "public");

  if (query.trim()) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`,
    );
  }

  if (language) {
    dbQuery = dbQuery.eq("language", language);
  }

  // Sorting
  if (sort === "title") {
    dbQuery = dbQuery.order("title", { ascending: true });
  } else if (sort === "popular") {
    dbQuery = dbQuery.order("total_words", { ascending: false });
  } else {
    // newest
    dbQuery = dbQuery.order("published_at", { ascending: false });
  }

  dbQuery = dbQuery.range(offset, offset + perPage - 1);

  const { data, error, count } = await dbQuery;

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  // Flatten author name from joined user_profiles
  const books = (data ?? []).map((b) => {
    const profiles = b.user_profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;
    const authorName = Array.isArray(profiles)
      ? profiles[0]?.display_name ?? null
      : profiles?.display_name ?? null;

    const { user_profiles: _profiles, ...rest } = b;
    return { ...rest, author_name: authorName };
  });

  return apiSuccess({
    books,
    total: count ?? 0,
    page,
    per_page: perPage,
  });
}
