"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, BookOpen, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { BookCard } from "@/components/dashboard/BookCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Book } from "@/types";

type Tab = "mine" | "reading" | "sales";

interface SalesData {
  totalRevenue: number;
  totalSales: number;
  bookStats: {
    bookId: string;
    title: string;
    price: number;
    sales: number;
    revenue: number;
  }[];
}

async function fetchSalesData(): Promise<SalesData> {
  const res = await fetch("/api/analytics/sales");
  if (!res.ok) throw new Error("판매 데이터를 불러오지 못했습니다.");
  const json = await res.json();
  return json.data;
}

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

  const {
    data: salesData,
    isLoading: salesLoading,
  } = useQuery<SalesData>({
    queryKey: ["sales-analytics"],
    queryFn: fetchSalesData,
    enabled: !!user && activeTab === "sales",
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
            { key: "sales", label: "판매 현황" },
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
      ) : activeTab === "sales" ? (
        salesLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : salesData ? (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">총 판매액</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesData.totalRevenue.toLocaleString("ko-KR")}원
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">총 판매 건수</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesData.totalSales}건
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Book stats table */}
            {salesData.bookStats.length > 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="border-b border-gray-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    책별 판매 현황
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {salesData.bookStats.map((stat) => (
                    <div
                      key={stat.bookId}
                      className="flex items-center justify-between px-5 py-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {stat.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {stat.price.toLocaleString("ko-KR")}원
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="font-medium text-gray-700">{stat.sales}건</p>
                          <p className="text-xs text-gray-400">판매</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {stat.revenue.toLocaleString("ko-KR")}원
                          </p>
                          <p className="text-xs text-gray-400">수입</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">아직 판매 기록이 없습니다</p>
              </div>
            )}
          </div>
        ) : null
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
