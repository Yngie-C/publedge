"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

interface BookWithAuthor extends Book {
  author_name?: string | null;
}

interface BookPreviewCardProps {
  book: BookWithAuthor;
  className?: string;
}


const GRADIENT_COLORS = [
  "from-blue-400 to-indigo-600",
  "from-purple-400 to-pink-600",
  "from-green-400 to-teal-600",
  "from-orange-400 to-red-600",
  "from-cyan-400 to-blue-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-green-600",
];

function getGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) & 0xffffffff;
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

function estimatedReadingTime(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function BookPreviewCard({ book, className }: BookPreviewCardProps) {
  const gradient = getGradient(book.title);
  const readingMinutes = estimatedReadingTime(book.total_words);

  return (
    <Link
      href={`/book/${book.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
        {book.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
          {book.title}
        </h3>
        {book.author_name && (
          <p className="mb-2 text-xs text-gray-500">{book.author_name}</p>
        )}
        {book.description && (
          <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-600">
            {book.description}
          </p>
        )}

        {/* Price */}
        <div className="mb-2">
          {book.price != null && book.price > 0 ? (
            <span className="text-sm font-bold text-gray-900">
              {book.price.toLocaleString("ko-KR")}원
            </span>
          ) : (
            <span className="text-sm font-medium text-green-600">무료</span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-auto flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {book.total_chapters}챕터
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {book.total_words.toLocaleString()}자
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readingMinutes}분
          </span>
        </div>
      </div>
    </Link>
  );
}
