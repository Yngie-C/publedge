import type { Metadata } from "next";
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
  return <BookDetailClient />;
}
