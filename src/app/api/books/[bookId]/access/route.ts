import { NextRequest } from "next/server";
import { getAuthUser, apiSuccess } from "@/lib/api-utils";
import { checkBookAccess } from "@/lib/access-control";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const user = await getAuthUser();
  const result = await checkBookAccess(user?.id ?? null, bookId);
  return apiSuccess(result);
}
