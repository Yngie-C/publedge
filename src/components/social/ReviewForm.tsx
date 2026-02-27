"use client";

import { useState } from "react";
import type { Review } from "@/types/social";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  bookId: string;
  existingReview?: Review;
  onSubmit: (data: {
    rating: number;
    title: string;
    content: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReviewForm({
  bookId: _bookId,
  existingReview,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [ratingError, setRatingError] = useState("");

  const isEdit = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setRatingError("별점을 선택해주세요");
      return;
    }
    setRatingError("");

    await onSubmit({ rating, title, content });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          별점 <span className="text-red-500">*</span>
        </p>
        <StarRating value={rating} onChange={setRating} size="lg" />
        {ratingError && (
          <p className="mt-1 text-xs text-red-600">{ratingError}</p>
        )}
      </div>

      <Input
        label="제목 (선택)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="리뷰 제목을 입력하세요"
        maxLength={100}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">내용 (선택)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 책에 대한 생각을 자유롭게 작성하세요..."
          rows={4}
          maxLength={2000}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors resize-none",
            "focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <p className="text-xs text-gray-400 text-right">
          {content.length}/2000
        </p>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
        )}
        <Button type="submit" size="sm" isLoading={isLoading}>
          {isEdit ? "수정하기" : "리뷰 작성"}
        </Button>
      </div>
    </form>
  );
}
