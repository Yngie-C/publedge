"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { BookSection } from "@/components/landing/BookSection";
import { BookSectionSkeleton } from "@/components/landing/BookSectionSkeleton";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import type { Book } from "@/types";

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

interface BookWithAuthor extends Book {
  author_name?: string | null;
}

interface LandingData {
  featured: BookWithAuthor[];
  newest: BookWithAuthor[];
  free: BookWithAuthor[];
  recentReviews: ReviewWithBook[];
  stats: {
    totalBooks: number;
    totalAuthors: number;
    totalReviews: number;
  };
}

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["landing"],
    queryFn: async () => {
      const res = await fetch("/api/landing");
      if (!res.ok) throw new Error("Failed to fetch landing data");
      const json = await res.json();
      return json.data as LandingData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* Hero */}
      <HeroSection totalBooks={data?.stats?.totalBooks} />

      {/* Content Sections */}
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-gray-700">
              데이터를 불러오는 중 오류가 발생했습니다
            </p>
            <p className="mt-1 text-sm text-gray-400">잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {/* Featured / Popular */}
        {isLoading ? (
          <div className="mb-12"><BookSectionSkeleton /></div>
        ) : data?.featured && data.featured.length > 0 ? (
          <div className="mb-12">
            <BookSection
              title="인기 콘텐츠"
              moreHref="/explore?sort=popular"
              books={data.featured}
            />
          </div>
        ) : null}

        {/* Newest */}
        {isLoading ? (
          <div className="mb-12"><BookSectionSkeleton /></div>
        ) : data?.newest && data.newest.length > 0 ? (
          <div className="mb-12">
            <BookSection
              title="새로 나온 콘텐츠"
              moreHref="/explore?sort=newest"
              books={data.newest}
            />
          </div>
        ) : null}

        {/* Free */}
        {isLoading ? (
          <div className="mb-12"><BookSectionSkeleton /></div>
        ) : data?.free && data.free.length > 0 ? (
          <div className="mb-12">
            <BookSection
              title="무료 콘텐츠"
              moreHref="/explore?priceRange=free"
              books={data.free}
            />
          </div>
        ) : null}
      </main>

      {/* Social Proof */}
      {(data?.stats || data?.recentReviews) && (
        <SocialProofSection
          stats={data?.stats ?? { totalBooks: 0, totalAuthors: 0, totalReviews: 0 }}
          reviews={data?.recentReviews ?? []}
        />
      )}

      {/* Author CTA */}
      <section className="bg-gray-900 px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold text-white">
            나만의 콘텐츠를 출판해보세요
          </h2>
          <p className="mb-8 text-gray-400">
            글을 쓰고, 출판하고, 오디오북으로 변환하세요. 누구나 무료로 시작할 수 있습니다.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link
              href={user ? "/studio" : "/auth/signup"}
              className="flex items-center gap-2"
            >
              {user ? "크리에이터 스튜디오" : "무료로 시작하기"}
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
