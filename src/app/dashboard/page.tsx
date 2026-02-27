"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, BookOpen } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { BookCard } from "@/components/dashboard/BookCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Book } from "@/types";

type Tab = "mine" | "reading";

async function fetchBooks(): Promise<Book[]> {
  const res = await fetch("/api/books");
  if (!res.ok) throw new Error("책 목록을 불러오지 못했습니다.");
  const json = await res.json();
  return json.data ?? [];
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("mine");
  const user = useAuthStore((s) => s.user);

  const {
    data: books = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: fetchBooks,
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    if (!confirm("이 전자책을 삭제하시겠습니까?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    refetch();
  };

  const publishedBooks = books.filter((b) => b.status === "published");
  const displayBooks = activeTab === "mine" ? books : publishedBooks;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">내 서재</h1>
        <Button asChild>
          <Link href="/create" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            새 전자책
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {(
          [
            { key: "mine", label: "내 전자책" },
            { key: "reading", label: "읽는 중" },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={
              activeTab === key
                ? "rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          책 목록을 불러오지 못했습니다.{" "}
          <button onClick={() => refetch()} className="underline">
            다시 시도
          </button>
        </div>
      ) : displayBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <BookOpen className="h-16 w-16 text-gray-300" />
          <div>
            <p className="text-lg font-semibold text-gray-700">
              {activeTab === "mine"
                ? "아직 전자책이 없습니다"
                : "읽고 있는 책이 없습니다"}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {activeTab === "mine"
                ? "첫 번째 전자책을 만들어보세요!"
                : "전자책을 출판하면 여기서 읽을 수 있어요."}
            </p>
          </div>
          {activeTab === "mine" && (
            <Button asChild>
              <Link href="/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                첫 전자책 만들기
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {displayBooks.map((book) => (
            <BookCard key={book.id} book={book} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
