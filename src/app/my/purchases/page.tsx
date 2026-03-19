"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";

interface Purchase {
  id: string;
  book_id: string;
  price_paid: number;
  purchased_at: string;
  status: string;
  books: {
    id: string;
    title: string;
  };
}

async function fetchPurchases(): Promise<Purchase[]> {
  const res = await fetch("/api/purchases");
  if (!res.ok) throw new Error("구매 내역을 불러오지 못했습니다.");
  const json = await res.json();
  return json.data ?? [];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    refunded: "bg-gray-100 text-gray-600",
    failed: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    completed: "완료",
    pending: "처리 중",
    refunded: "환불",
    failed: "실패",
  };
  const cls = styles[status] ?? "bg-gray-100 text-gray-600";
  const label = labels[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function PurchasesPage() {
  const user = useAuthStore((s) => s.user);

  const { data: purchases = [], isLoading, isError, refetch } = useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: fetchPurchases,
    enabled: !!user,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">구매 내역</h1>
        <p className="mt-1 text-sm text-gray-500">결제한 전자책 내역을 확인하세요.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          구매 내역을 불러오지 못했습니다.{" "}
          <button onClick={() => refetch()} className="underline">
            다시 시도
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-gray-700">구매 내역이 없습니다</p>
          <p className="text-sm text-gray-400">결제가 완료되면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  책 제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {new Date(purchase.purchased_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {purchase.books ? (
                      <Link
                        href={`/book/${purchase.book_id}`}
                        className="font-medium text-gray-900 hover:text-gray-600 hover:underline"
                      >
                        {purchase.books.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400">삭제된 책</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {purchase.price_paid.toLocaleString("ko-KR")}원
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <StatusBadge status={purchase.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
