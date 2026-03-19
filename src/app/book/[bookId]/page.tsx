"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Headphones,
  Share2,
  Edit,
  Globe,
  Lock,
  FileText,
  Clock,
  List,
  Star,
  ChevronDown,
  ChevronUp,
  Check,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import type { Book, Chapter, Audiobook } from "@/types";

interface BookDetailData {
  book: Book & { author_name?: string | null; price: number; is_free: boolean };
  chapters: Chapter[];
  audiobook: Audiobook | null;
  reviews: Review[];
}

interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  reviewer_name?: string | null;
}

const LANGUAGE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

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

async function fetchBookDetail(bookId: string): Promise<BookDetailData> {
  const res = await fetch(`/api/books/${bookId}/detail`);
  if (!res.ok) throw new Error("콘텐츠 정보를 불러오지 못했습니다.");
  const json = await res.json();
  return json.data;
}

async function submitReview(payload: {
  bookId: string;
  rating: number;
  content: string;
}): Promise<void> {
  const res = await fetch(`/api/books/${payload.bookId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: payload.rating, content: payload.content }),
  });
  if (!res.ok) throw new Error("리뷰 등록에 실패했습니다.");
}

async function togglePublish(bookId: string, publish: boolean): Promise<void> {
  const res = await fetch(`/api/books/${bookId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: publish ? "published" : "draft",
      visibility: publish ? "public" : "private",
    }),
  });
  if (!res.ok) throw new Error("상태 변경에 실패했습니다.");
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer",
          )}
        >
          <Star
            className={cn(
              "h-5 w-5",
              (hover || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [showAllChapters, setShowAllChapters] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [accessInfo, setAccessInfo] = useState<{
    hasAccess: boolean;
    reason: string;
  } | null>(null);

  const { data, isLoading, isError } = useQuery<BookDetailData>({
    queryKey: ["book-detail", bookId],
    queryFn: () => fetchBookDetail(bookId),
    enabled: !!bookId,
  });

  const reviewMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-detail", bookId] });
      setReviewComment("");
      setReviewRating(5);
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ publish }: { publish: boolean }) =>
      togglePublish(bookId, publish),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-detail", bookId] });
    },
  });

  useEffect(() => {
    if (!bookId) return;
    fetch(`/api/books/${bookId}/access`)
      .then((r) => r.json())
      .then((json) => setAccessInfo(json.data))
      .catch(() => {});
  }, [bookId]);

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-gray-700">
          콘텐츠를 불러올 수 없습니다
        </p>
        <p className="mt-1 text-sm text-gray-400">
          삭제됐거나 접근 권한이 없을 수 있습니다.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  const { book, chapters, audiobook, reviews } = data;
  const isOwner = user?.id === book.owner_id;
  const isPublished = book.status === "published";
  const readingMinutes = Math.max(1, Math.round(book.total_words / 200));
  const langLabel = LANGUAGE_LABELS[book.language] ?? book.language;
  const gradient = getGradient(book.title);
  const displayChapters = showAllChapters ? chapters : chapters.slice(0, 5);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Book header */}
      <div className="flex flex-col gap-8 sm:flex-row">
        {/* Cover */}
        <div className="flex-shrink-0 self-start">
          <div className="relative h-72 w-48 overflow-hidden rounded-xl shadow-lg sm:h-80 sm:w-56">
            {book.cover_image_url ? (
              <Image
                src={book.cover_image_url}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 192px, 224px"
                priority
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center bg-gradient-to-br",
                  gradient,
                )}
              >
                <span className="text-7xl font-bold text-white/80 select-none">
                  {book.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {langLabel}
            </span>
            {isPublished ? (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <Globe className="h-3 w-3" />
                공개
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                <Lock className="h-3 w-3" />
                비공개
              </span>
            )}
          </div>

          <h1 className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {book.title}
          </h1>

          {book.author_name && (
            <p className="mb-3 text-sm text-gray-500">by {book.author_name}</p>
          )}

          {book.description && (
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              {book.description}
            </p>
          )}

          {/* Stats */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <List className="h-4 w-4 text-gray-400" />
              {book.total_chapters}챕터
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gray-400" />
              {book.total_words.toLocaleString()}자
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              약 {readingMinutes}분
            </span>
            {reviews.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {avgRating.toFixed(1)} ({reviews.length}개 리뷰)
              </span>
            )}
          </div>

          {/* Price display */}
          {!isOwner && book.price > 0 && (
            <div className="mb-4">
              <span className="text-2xl font-bold text-gray-900">
                {book.price.toLocaleString("ko-KR")}원
              </span>
            </div>
          )}
          {!isOwner && book.price === 0 && (
            <div className="mb-4">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                무료
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* 소유자 */}
            {isOwner && (
              <>
                <Button asChild>
                  <Link href={`/reader/${book.id}`} className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    읽기
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/editor/${book.id}`} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    편집
                  </Link>
                </Button>
                <Button
                  variant={isPublished ? "secondary" : "default"}
                  isLoading={publishMutation.isPending}
                  onClick={() => publishMutation.mutate({ publish: !isPublished })}
                >
                  {isPublished ? "비공개로 전환" : "발행하기"}
                </Button>
              </>
            )}

            {/* 비소유자 - 접근 가능 (무료 또는 구매 완료) */}
            {!isOwner && accessInfo?.hasAccess && (
              <Button asChild>
                <Link href={`/reader/${book.id}`} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  읽기
                </Link>
              </Button>
            )}

            {/* 비소유자 - 유료 미구매 */}
            {!isOwner && !accessInfo?.hasAccess && book.price > 0 && (
              <Button asChild>
                <Link href={`/payments/checkout/${book.id}`} className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  구매하기
                </Link>
              </Button>
            )}

            {/* 비소유자 - 무료 (accessInfo 로딩 전 fallback) */}
            {!isOwner && !accessInfo && book.price === 0 && (
              <Button asChild>
                <Link href={`/reader/${book.id}`} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  읽기
                </Link>
              </Button>
            )}

            {/* 오디오북 */}
            {audiobook && audiobook.status === "completed" && (isOwner || accessInfo?.hasAccess) && (
              <Button variant="secondary" asChild>
                <Link href={`/listen/${book.id}`} className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  듣기
                </Link>
              </Button>
            )}

            {/* 공유 */}
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

      <div className="mt-10 space-y-10">
        {/* Chapter list */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            목차 ({chapters.length}챕터)
          </h2>
          {chapters.length === 0 ? (
            <p className="text-sm text-gray-400">챕터가 없습니다.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {displayChapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-3.5 text-sm",
                    idx > 0 && "border-t border-gray-100",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 text-xs font-medium text-gray-400 w-6">
                      {chapter.order_index + 1}
                    </span>
                    <span className="truncate font-medium text-gray-800">
                      {chapter.title}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-4 text-xs text-gray-400">
                    {chapter.word_count.toLocaleString()}자
                  </span>
                </div>
              ))}
              {chapters.length > 5 && (
                <button
                  onClick={() => setShowAllChapters((v) => !v)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-gray-100 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  {showAllChapters ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      접기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {chapters.length - 5}개 더 보기
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            리뷰 ({reviews.length})
          </h2>

          {/* Review list */}
          {reviews.length > 0 ? (
            <div className="mb-6 space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {review.reviewer_name ?? "익명"}
                      </span>
                      <StarRating value={review.rating} readonly />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  {review.content && (
                    <p className="text-sm leading-relaxed text-gray-600">
                      {review.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-6 text-sm text-gray-400">아직 리뷰가 없습니다.</p>
          )}

          {/* Add review form */}
          {user && !isOwner && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                리뷰 작성
              </h3>
              <div className="mb-3">
                <StarRating
                  value={reviewRating}
                  onChange={setReviewRating}
                />
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="이 콘텐츠에 대한 생각을 공유해주세요..."
                rows={3}
                className="mb-3 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
              <Button
                size="sm"
                isLoading={reviewMutation.isPending}
                disabled={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    bookId: book.id,
                    rating: reviewRating,
                    content: reviewComment,
                  })
                }
              >
                리뷰 등록
              </Button>
              {reviewMutation.isError && (
                <p className="mt-2 text-xs text-red-600">
                  리뷰 등록에 실패했습니다. 다시 시도해주세요.
                </p>
              )}
            </div>
          )}

          {!user && (
            <p className="text-sm text-gray-400">
              리뷰를 작성하려면{" "}
              <Link href="/auth/login" className="text-gray-900 underline">
                로그인
              </Link>
              하세요.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
