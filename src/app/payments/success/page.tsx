"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"confirming" | "success" | "error">("confirming");
  const [bookId, setBookId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    async function confirmPayment() {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "결제 승인에 실패했습니다.");
        }

        setBookId(json.data.bookId);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.",
        );
      }
    }

    confirmPayment();
  }, [searchParams]);

  if (status === "confirming") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-red-700">결제 처리 실패</p>
        <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => router.push("/explore")}>
          둘러보기로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
      <h1 className="font-logo text-2xl font-bold text-gray-900">결제가 완료되었습니다!</h1>
      <p className="mt-2 text-sm text-gray-500">
        구매한 콘텐츠를 바로 읽어보세요.
      </p>
      <div className="mt-6 flex gap-3">
        {bookId && (
          <Button className="rounded-full" onClick={() => router.push(`/reader/${bookId}`)}>
            바로 읽기
          </Button>
        )}
        <Button variant="outline" className="rounded-full" onClick={() => router.push("/library")}>
          내 서재로 이동
        </Button>
      </div>
    </div>
  );
}
