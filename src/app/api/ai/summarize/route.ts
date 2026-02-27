import { NextRequest } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { callChatCompletion } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

const MAX_INPUT_CHARS = 50000;
const RATE_LIMIT = 10; // per hour

async function checkRateLimit(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "summarize")
    .gte("created_at", oneHourAgo);

  return (count ?? 0) < RATE_LIMIT;
}

async function logUsage(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ai_usage_logs").insert({
    user_id: userId,
    action: "summarize",
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json().catch(() => null);
  if (!body?.text) {
    return apiError("text is required", "VALIDATION_ERROR", 400);
  }

  const { text, language = "ko" } = body as {
    text: string;
    language?: string;
  };

  if (typeof text !== "string" || text.trim().length === 0) {
    return apiError("text must be a non-empty string", "VALIDATION_ERROR", 400);
  }

  if (text.length > MAX_INPUT_CHARS) {
    return apiError(
      `text exceeds maximum length of ${MAX_INPUT_CHARS} characters`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const allowed = await checkRateLimit(user.id);
  if (!allowed) {
    return apiError(
      "Rate limit exceeded: 10 summarizations per hour",
      "VALIDATION_ERROR",
      429,
    );
  }

  const langLabel =
    language === "ko"
      ? "Korean"
      : language === "ja"
        ? "Japanese"
        : language === "zh"
          ? "Chinese"
          : "English";

  const summary = await callChatCompletion(
    [
      {
        role: "system",
        content: `You are a helpful assistant that summarizes text concisely in ${langLabel}. Provide a clear, concise summary that captures the main points. Respond only with the summary text, no preamble.`,
      },
      {
        role: "user",
        content: `Please summarize the following text:\n\n${text}`,
      },
    ],
    { model: "gpt-4o-mini", temperature: 0.5, max_tokens: 512 },
  );

  await logUsage(user.id);

  return apiSuccess({ summary });
}
