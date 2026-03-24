import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BookDetailClient } from "./BookDetailClient";

interface Props {
  params: Promise<{ bookId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params;

  try {
    const supabase = await createClient();
    const { data: book } = await supabase
      .from("books")
      .select("title, description, cover_image_url, language")
      .eq("id", bookId)
      .single();

    if (!book) {
      return { title: "콘텐츠를 찾을 수 없습니다" };
    }

    const title = book.title;
    const description = book.description || `${book.title} - inspic에서 읽기`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        ...(book.cover_image_url && { images: [{ url: book.cover_image_url }] }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(book.cover_image_url && { images: [book.cover_image_url] }),
      },
    };
  } catch {
    return { title: "inspic" };
  }
}

export default function BookDetailPage() {
  return (
    <Suspense fallback={<BookDetailSkeleton />}>
      <BookDetailClient />
    </Suspense>
  );
}

function BookDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="h-72 w-48 animate-pulse rounded-xl bg-gray-200 sm:h-80 sm:w-56" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
