"use client";

import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { BookSection } from "@/components/landing/BookSection";
import { BookSectionSkeleton } from "@/components/landing/BookSectionSkeleton";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
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

      {/* 핵심 가치 섹션 */}
      <FeaturesSection />

      {/* Content Sections */}
      <main className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
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
          <div className="mb-24"><BookSectionSkeleton /></div>
        ) : data?.featured && data.featured.length > 0 ? (
          <div className="mb-24">
            <BookSection
              title="지금 주목받는 콘텐츠"
              moreHref="/explore?sort=popular"
              books={data.featured}
            />
          </div>
        ) : null}

        {/* Newest */}
        {isLoading ? (
          <div className="mb-24"><BookSectionSkeleton /></div>
        ) : data?.newest && data.newest.length > 0 ? (
          <div className="mb-24">
            <BookSection
              title="새로 나온 콘텐츠"
              moreHref="/explore?sort=newest"
              books={data.newest}
            />
          </div>
        ) : null}

        {/* Free */}
        {isLoading ? (
          <div className="mb-24"><BookSectionSkeleton /></div>
        ) : data?.free && data.free.length > 0 ? (
          <div className="mb-24">
            <BookSection
              title="무료 콘텐츠"
              moreHref="/explore?priceRange=free"
              books={data.free}
            />
          </div>
        ) : null}
      </main>

      {/* Social Proof */}
      {/* {(data?.stats || data?.recentReviews) && (
        <SocialProofSection
          stats={data?.stats ?? { totalBooks: 0, totalAuthors: 0, totalReviews: 0 }}
          reviews={data?.recentReviews ?? []}
        />
      )} */}

      <Footer />
    </div>
  );
}
