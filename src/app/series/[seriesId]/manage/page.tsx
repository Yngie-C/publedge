"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Settings,
  BookOpen,
  Users,
  Send,
  FileText,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { ChapterPublishForm } from "@/components/series/ChapterPublishForm";
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

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ongoing: { label: "연재중", className: "bg-green-100 text-green-700" },
  hiatus: { label: "휴재", className: "bg-amber-100 text-amber-700" },
  completed: { label: "완결", className: "bg-blue-100 text-blue-700" },
};

const DAY_LABELS: Record<string, string> = {
  mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일",
};

interface SeriesDetailData {
  book: Book & { author_name?: string | null };
  chapters: Chapter[];
  series_metadata: SeriesMetadata;
  subscriber_count: number;
  published_chapter_count: number;
}

async function fetchSeriesDetail(seriesId: string): Promise<SeriesDetailData> {
  const res = await fetch(`/api/series/${seriesId}`);
  if (!res.ok) throw new Error("시리즈 정보를 불러오지 못했습니다.");
  const json = await res.json();
  return json.data;
}

async function publishChapter(seriesId: string, chapterId: string): Promise<void> {
  const res = await fetch(`/api/series/${seriesId}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapter_id: chapterId }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "발행에 실패했습니다.");
  }
}

export default function SeriesManagePage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<SeriesDetailData>({
    queryKey: ["series-manage", seriesId],
    queryFn: () => fetchSeriesDetail(seriesId),
    enabled: !!seriesId && !!user,
  });

  const publishMutation = useMutation({
    mutationFn: ({ chapterId }: { chapterId: string }) =>
      publishChapter(seriesId, chapterId),
    onMutate: ({ chapterId }) => setPublishingId(chapterId),
    onSettled: () => setPublishingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series-manage", seriesId] });
    },
  });

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

  const { book, chapters, series_metadata, subscriber_count, published_chapter_count } = data;
  const gradient = getGradient(book.title);
  const statusInfo = STATUS_LABELS[series_metadata.series_status];
  const draftChapters = chapters.filter((c) => c.status === "draft");
  const publishedChapters = chapters.filter((c) => c.status === "published");
  const isOwner = user?.id === book.owner_id;

  if (!isOwner) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-gray-700">접근 권한이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link
          href="/creator"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          크리에이터 스튜디오
        </Link>

        {/* Series header */}
        <div className="mb-6 flex items-start gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow">
            {book.cover_image_url ? (
              <Image
                src={book.cover_image_url}
                alt={book.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center bg-gradient-to-br",
                  gradient,
                )}
              >
                <span className="text-2xl font-bold text-white/80 select-none">
                  {book.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusInfo.className,
                )}
              >
                {statusInfo.label}
              </span>
            </div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 truncate">{book.title}</h1>
            {book.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{book.description}</p>
            )}
            {series_metadata.schedule_description && (
              <p className="mt-1 text-xs text-gray-400">
                연재 주기: {series_metadata.schedule_description}
                {series_metadata.schedule_day && ` (${DAY_LABELS[series_metadata.schedule_day]}요일)`}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild className="flex-shrink-0">
            <Link href={`/series/${seriesId}/settings`} className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              설정
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div className="flex justify-center mb-2">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{published_chapter_count}</p>
            <p className="text-xs text-gray-500">발행된 챕터</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div className="flex justify-center mb-2">
              <div className="rounded-lg bg-amber-100 p-2">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{draftChapters.length}</p>
            <p className="text-xs text-gray-500">임시저장</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div className="flex justify-center mb-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{subscriber_count}</p>
            <p className="text-xs text-gray-500">구독자</p>
          </div>
        </div>

        {/* New chapter form */}
        <div className="mb-6">
          <ChapterPublishForm
            seriesId={seriesId}
            nextOrderIndex={chapters.length}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["series-manage", seriesId] })
            }
          />
        </div>

        {/* Draft chapters */}
        {draftChapters.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-amber-500" />
              임시저장 챕터 ({draftChapters.length})
            </h2>
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
              {draftChapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-3.5",
                    idx > 0 && "border-t border-gray-100",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      임시저장
                    </span>
                    <span className="truncate text-sm font-medium text-gray-800">
                      {chapter.order_index + 1}화. {chapter.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/editor/${seriesId}?chapter=${chapter.id}`}>편집</Link>
                    </Button>
                    <Button
                      size="sm"
                      isLoading={publishingId === chapter.id}
                      disabled={publishingId !== null}
                      onClick={() => publishMutation.mutate({ chapterId: chapter.id })}
                      className="flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      발행
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Published chapters */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
            <BookOpen className="h-4 w-4 text-green-500" />
            발행된 챕터 ({publishedChapters.length})
          </h2>
          {publishedChapters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-400">
              아직 발행된 챕터가 없습니다.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {publishedChapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-3.5",
                    idx > 0 && "border-t border-gray-100",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      발행됨
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800">
                        {chapter.order_index + 1}화. {chapter.title}
                      </span>
                      {chapter.published_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(chapter.published_at).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="flex-shrink-0 ml-4">
                    <Link href={`/editor/${seriesId}?chapter=${chapter.id}`}>편집</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
