"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { BookCard } from "@/components/dashboard/BookCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Book } from "@/types";

type Tab = "books" | "sales";

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

async function fetchBooks(): Promise<Book[]> {
  const res = await fetch("/api/books");
  if (!res.ok) throw new Error("콘텐츠 목록을 불러오지 못했습니다.");
  const json = await res.json();
  return json.data ?? [];
}

async function fetchSalesData(): Promise<SalesData> {
  const res = await fetch("/api/analytics/sales");
  if (!res.ok) throw new Error("판매 데이터를 불러오지 못했습니다.");
  const json = await res.json();
  return json.data;
}

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("books");
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

  const { data: salesData, isLoading: salesLoading } = useQuery<SalesData>({
    queryKey: ["sales-analytics"],
    queryFn: fetchSalesData,
    enabled: !!user && activeTab === "sales",
  });

  const handleDelete = async (id: string) => {
    if (!confirm("이 콘텐츠를 삭제하시겠습니까?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">크리에이터 스튜디오</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/analytics">상세 분석</Link>
          </Button>
          <Button asChild>
            <Link href="/create">새 콘텐츠 만들기</Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {(
          [
            { key: "books" as Tab, label: "내 콘텐츠" },
            { key: "sales" as Tab, label: "판매 현황" },
          ] as const
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
      {activeTab === "books" && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-4 py-16 text-gray-500">
              <p>콘텐츠 목록을 불러오지 못했습니다.</p>
              <Button variant="outline" onClick={() => refetch()}>
                다시 시도
              </Button>
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-gray-500">
              <p>아직 작성한 콘텐츠가 없습니다.</p>
              <Button asChild>
                <Link href="/create">첫 콘텐츠 만들기</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "sales" && (
        <>
          {salesLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : !salesData || salesData.bookStats.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-gray-500">
              <p>아직 판매 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 max-w-md">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">총 판매액</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    ₩{salesData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">총 판매 건수</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {salesData.totalSales.toLocaleString()}건
                  </p>
                </div>
              </div>

              {/* Per-book stats table */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">
                        콘텐츠 제목
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">
                        가격
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">
                        판매 건수
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">
                        매출
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salesData.bookStats.map((stat) => (
                      <tr key={stat.bookId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{stat.title}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          ₩{stat.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {stat.sales.toLocaleString()}건
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ₩{stat.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
