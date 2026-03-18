// Toss Payments 서버 사이드 유틸리티

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
const TOSS_API_URL = "https://api.tosspayments.com/v1";

interface TossConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  totalAmount: number;
  requestedAt: string;
  approvedAt: string;
  [key: string]: unknown;
}

export async function confirmPayment(
  params: TossConfirmRequest,
): Promise<TossPaymentResponse> {
  const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "결제 승인에 실패했습니다.");
  }

  return response.json();
}

export function generateOrderId(bookId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `PB_${bookId.substring(0, 8)}_${timestamp}_${random}`;
}
