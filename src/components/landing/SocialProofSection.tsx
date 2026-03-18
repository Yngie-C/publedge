"use client";

import Link from "next/link";
import { BookOpen, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { StatsCounter } from "./StatsCounter";
import { StarRating } from "@/components/social/StarRating";

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

interface SocialProofSectionProps {
  stats: {
    totalBooks: number;
    totalAuthors: number;
    totalReviews: number;
  };
  reviews: ReviewWithBook[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SocialProofSection({ stats, reviews }: SocialProofSectionProps) {
  return (
    <section className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mb-12 grid grid-cols-3 gap-4">
          <StatsCounter
            icon={BookOpen}
            value={stats.totalBooks}
            label="등록된 전자책"
          />
          <StatsCounter
            icon={Users}
            value={stats.totalAuthors}
            label="활동 저자"
          />
          <StatsCounter
            icon={MessageSquare}
            value={stats.totalReviews}
            label="독자 리뷰"
          />
        </div>

        <h2 className="mb-8 text-center text-xl font-bold text-gray-900">
          독자들의 리뷰
        </h2>

        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={cardItem}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {getInitials(review.user_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {review.user_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(review.created_at))}
                  </p>
                </div>
              </div>

              <StarRating value={review.rating} readonly size="sm" />

              <Link
                href={`/book/${review.book_id}`}
                className="mt-1 block text-xs text-gray-400 transition-colors hover:text-gray-600"
              >
                📖 {review.book_title}
              </Link>

              {review.content && (
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-gray-600">
                  {review.content}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
