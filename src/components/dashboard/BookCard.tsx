"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Edit3, Trash2, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Book } from "@/types";

interface BookCardProps {
  book: Book;
  onDelete?: (id: string) => void;
}

const statusLabel: Record<string, string> = {
  draft: "초안",
  processing: "처리 중",
  published: "출판됨",
  archived: "보관됨",
};

const statusStyle: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  processing: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-200 text-gray-500",
};

export function BookCard({ book, onDelete }: BookCardProps) {
  const readingTime = Math.max(1, Math.ceil(book.total_words / 200));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-16 w-16 text-gray-300" />
          </div>
        )}
        {/* Status badge */}
        <span
          className={cn(
            "absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
            statusStyle[book.status],
          )}
        >
          {statusLabel[book.status] ?? book.status}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold text-gray-900 leading-snug">
          {book.title}
        </h3>
        {book.description && (
          <p className="line-clamp-2 text-xs text-gray-500">{book.description}</p>
        )}

        {/* Stats */}
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {book.total_chapters}챕터
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readingTime}분
          </span>
          <span>{book.total_words.toLocaleString()}자</span>
        </div>

        {/* Actions */}
        <div className="mt-2 flex gap-2">
          {book.status === "published" && (
            <Button variant="default" size="sm" className="flex-1" asChild>
              <Link href={`/reader/${book.id}`}>읽기</Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/create/edit/${book.id}`}>
              <Edit3 className="h-3.5 w-3.5" />
              편집
            </Link>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(book.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
