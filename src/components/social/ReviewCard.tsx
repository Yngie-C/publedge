"use client";

import { useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import type { Review } from "@/types/social";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
  isOwn?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  isDeleting?: boolean;
}

export function ReviewCard({
  review,
  isOwn = false,
  onEdit,
  onDelete,
  isDeleting = false,
}: ReviewCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const displayName =
    review.user_profile?.display_name ?? "익명 사용자";
  const avatarUrl = review.user_profile?.avatar_url;
  const initial = displayName[0]?.toUpperCase() ?? "U";

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(review.created_at));

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete?.(review.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-400">{formattedDate}</p>
          </div>
        </div>

        {/* Own review actions */}
        {isOwn && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(review)}
                className="h-7 w-7 p-0"
                aria-label="리뷰 수정"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant={confirmDelete ? "destructive" : "ghost"}
                size="sm"
                onClick={handleDeleteClick}
                onBlur={() => setConfirmDelete(false)}
                isLoading={isDeleting}
                className={cn("h-7 px-2 text-xs", !confirmDelete && "w-7 p-0")}
                aria-label="리뷰 삭제"
              >
                {confirmDelete ? (
                  "확인"
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Star rating */}
      <div className="mt-3">
        <StarRating value={review.rating} readonly size="sm" />
      </div>

      {/* Content */}
      {review.title && (
        <p className="mt-2 text-sm font-semibold text-gray-900">
          {review.title}
        </p>
      )}
      {review.content && (
        <p className="mt-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {review.content}
        </p>
      )}
    </div>
  );
}
