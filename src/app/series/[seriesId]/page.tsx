"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { SeriesInfo } from "@/components/series/SeriesInfo";
import { SubscribeButton } from "@/components/series/SubscribeButton";
import { ChapterList } from "@/components/series/ChapterList";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import type { Book, Chapter, SeriesMetadata } from "@/types";

const GRADIENT_COLORS = [
  "from-blue-400 to-indigo-600",
  "from-purple-400 to-pink-600",
  "from-green-400 to-teal-600",
  "from-orange-400 to-red-600",
];

function getGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) & 0xffffffff;
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

interface SeriesLandingData {
  book: Book & { author_name?: string | null };
  chapters: Chapter[];
  series_metadata: SeriesMetadata;
  subscriber_count: number;
  published_chapter_count: number;
  is_subscribed?: boolean;
}

async function fetchSeriesLanding(seriesId: string): Promise<SeriesLandingData> {
  const res = await fetch(`/api/series/${seriesId}`);
  if (!res.ok) throw new Error("시리즈 정보를 불러오지 못했습니다.");
  const json = await res.json();
  return json.data;
}

export default function SeriesPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery<SeriesLandingData>({
    queryKey: ["series-landing", seriesId],
    queryFn: () => fetchSeriesLanding(seriesId),
    enabled: !!seriesId,
  });

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-gray-700">시리즈를 불러올 수 없습니다</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const { book, chapters, series_metadata, subscriber_count, published_chapter_count, is_subscribed } = data;
  const gradient = getGradient(book.title);
  const isOwner = user?.id === book.owner_id;

  // Filter to published chapters only, ordered by published_at
  const publishedChapters = chapters
    .filter((c) => c.status === "published")
    .sort((a, b) => {
      const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
      return aTime - bTime;
    });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto max-w-4xl w-full flex-1 px-4 py-10 sm:px-6">
        <Link
          href="/explore"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          탐색으로
        </Link>

        {/* Series header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row">
          {/* Cover */}
          <div className="flex-shrink-0 self-start">
            <div className="relative h-64 w-44 overflow-hidden rounded-xl shadow-lg sm:h-72 sm:w-48">
              {book.cover_image_url ? (
                <Image
                  src={book.cover_image_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 176px, 192px"
                  priority
                />
              ) : (
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center bg-gradient-to-br",
                    gradient,
                  )}
                >
                  <span className="text-6xl font-bold text-white/80 select-none">
                    {book.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{book.title}</h1>

            {book.author_name && (
              <Link
                href={`/author/${book.owner_id}`}
                className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900 hover:underline"
              >
                by {book.author_name}
              </Link>
            )}

            {book.description && (
              <p className="mb-5 text-sm leading-relaxed text-gray-600">{book.description}</p>
            )}

            {/* Series info badges */}
            <div className="mb-5">
              <SeriesInfo
                metadata={series_metadata}
                publishedChapterCount={published_chapter_count}
                subscriberCount={subscriber_count}
              />
            </div>

            {/* Price */}
            {book.price > 0 ? (
              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  {book.price.toLocaleString("ko-KR")}원
                </span>
              </div>
            ) : (
              <div className="mb-4">
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  무료
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Owner actions */}
              {isOwner && (
                <Button asChild>
                  <Link href={`/series/${seriesId}/manage`}>시리즈 관리</Link>
                </Button>
              )}

              {/* Reader actions */}
              {!isOwner && (
                <>
                  <SubscribeButton
                    seriesId={seriesId}
                    initialSubscribed={is_subscribed ?? false}
                  />
                  {publishedChapters.length > 0 && (
                    <Button variant="outline" asChild>
                      <Link href={`/reader/${book.id}?chapter=${publishedChapters[0].id}`}>
                        첫화 읽기
                      </Link>
                    </Button>
                  )}
                </>
              )}

              {/* Share */}
              <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    공유
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            챕터 목록 ({publishedChapters.length}화)
          </h2>
          <ChapterList bookId={book.id} chapters={publishedChapters} />
        </section>
      </main>
    </div>
  );
}
