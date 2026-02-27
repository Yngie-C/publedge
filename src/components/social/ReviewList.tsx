"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import type { Review } from "@/types/social";
import { ReviewCard } from "./ReviewCard";
import { StarRating } from "./StarRating";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "rating_high" | "rating_low";

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  deletingId?: string;
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: "최신순",
  rating_high: "별점 높은순",
  rating_low: "별점 낮은순",
};

export function ReviewList({
  reviews,
  currentUserId,
  onEdit,
  onDelete,
  deletingId,
}: ReviewListProps) {
  const [sort, setSort] = useState<SortOption>("newest");

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === "rating_high") return b.rating - a.rating;
    if (sort === "rating_low") return a.rating - b.rating;
    return 0;
  });

  const avg = average(reviews.map((r) => r.rating));
  const count = reviews.length;

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: count > 0 ? (reviews.filter((r) => r.rating === star).length / count) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      {count > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
          {/* Average */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-4xl font-bold text-gray-900">
              {avg.toFixed(1)}
            </span>
            <StarRating value={avg} readonly size="sm" />
            <span className="text-xs text-gray-400">{count}개의 리뷰</span>
          </div>

          {/* Distribution */}
          <div className="flex-1 w-full space-y-1.5">
            {ratingDist.map(({ star, count: c, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sort & count header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          리뷰 {count}개
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Reviews */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageSquare className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">아직 리뷰가 없습니다</p>
          <p className="text-xs text-gray-400">첫 번째 리뷰를 작성해보세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.user_id === currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === review.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
