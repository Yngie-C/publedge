import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { confirmPayment } from "@/lib/toss-payments";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { paymentKey?: string; orderId?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { paymentKey, orderId, amount } = body;
  if (!paymentKey || !orderId || !amount) {
    return apiError("paymentKey, orderId, amount are required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  // 트랜잭션 조회
  const { data: transaction } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("toss_order_id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!transaction) {
    return apiError("결제 정보를 찾을 수 없습니다", "NOT_FOUND", 404);
  }

  // 금액 검증
  if (transaction.amount !== amount) {
    return apiError("결제 금액이 일치하지 않습니다", "VALIDATION_ERROR", 400);
  }

  try {
    // Toss Payments 승인 요청
    const tossResponse = await confirmPayment({ paymentKey, orderId, amount });

    // 트랜잭션 업데이트
    await supabase
      .from("payment_transactions")
      .update({
        toss_payment_key: paymentKey,
        status: "done",
        method: tossResponse.method,
        raw_response: tossResponse as unknown as Record<string, unknown>,
      })
      .eq("id", transaction.id);

    // 구매 기록 생성
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        book_id: transaction.book_id,
        price_paid: amount,
        payment_method: tossResponse.method,
        status: "completed",
      })
      .select()
      .single();

    if (purchaseError) {
      return apiError("구매 기록 생성에 실패했습니다", "SERVER_ERROR", 500);
    }

    // 트랜잭션에 purchase_id 연결
    await supabase
      .from("payment_transactions")
      .update({ purchase_id: purchase.id })
      .eq("id", transaction.id);

    return apiSuccess({
      purchaseId: purchase.id,
      bookId: transaction.book_id,
      status: "completed",
    });
  } catch (error) {
    // 결제 실패 시 트랜잭션 상태 업데이트
    await supabase
      .from("payment_transactions")
      .update({ status: "aborted" })
      .eq("id", transaction.id);

    return apiError(
      error instanceof Error ? error.message : "결제 승인에 실패했습니다",
      "SERVER_ERROR",
      500,
    );
  }
}
