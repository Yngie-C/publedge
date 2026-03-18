"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookGrid } from "@/components/explore/BookGrid";
import { SearchBar, type SearchFilters } from "@/components/explore/SearchBar";
import { Spinner } from "@/components/ui/spinner";
import type { Book } from "@/types";

interface BookWithAuthor extends Book {
  author_name?: string | null;
}

interface ExploreApiResponse {
  data: {
    books: BookWithAuthor[];
    total: number;
    page: number;
    per_page: number;
  };
}

async function fetchPublicBooks(
  filters: SearchFilters,
  page: number,
): Promise<{ books: BookWithAuthor[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.language) params.set("language", filters.language);
  params.set("sort", filters.sort);
  if (filters.priceRange) params.set("priceRange", filters.priceRange);
  params.set("page", String(page));
  params.set("per_page", "24");

  const res = await fetch(`/api/explore?${params.toString()}`);
  if (!res.ok) throw new Error("탐색 데이터를 불러오지 못했습니다.");
  const json: ExploreApiResponse = await res.json();
  return {
    books: json.data.books ?? [],
    total: json.data.total ?? 0,
  };
}

const PER_PAGE = 24;

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    query: searchParams.get("q") ?? "",
    language: searchParams.get("language") ?? "",
    sort: (searchParams.get("sort") as SearchFilters["sort"]) ?? "newest",
    priceRange: searchParams.get("priceRange") ?? "",
  }));
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore", filters, page],
    queryFn: () => fetchPublicBooks(filters, page),
    staleTime: 30_000,
  });

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const books = data?.books ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          전자책 탐색
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          다양한 전자책을 발견하고 읽어보세요
        </p>
      </div>

      {/* Search & filters */}
      <div className="mb-8">
        <SearchBar filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      {/* Results count */}
      {!isLoading && !isError && (
        <div className="mb-4 text-sm text-gray-500">
          {total > 0 ? `${total.toLocaleString()}개의 전자책` : ""}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-gray-700">
            데이터를 불러오는 중 오류가 발생했습니다
          </p>
          <p className="mt-1 text-sm text-gray-400">잠시 후 다시 시도해주세요.</p>
        </div>
      ) : (
        <BookGrid books={books} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            이전
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                    pageNum === page
                      ? "bg-gray-900 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
