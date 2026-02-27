import { NextRequest } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { callChatCompletion } from "@/lib/openai";

const MAX_INPUT_CHARS = 50000;

interface Correction {
  original: string;
  suggested: string;
  reason: string;
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

  const langLabel =
    language === "ko"
      ? "Korean"
      : language === "ja"
        ? "Japanese"
        : language === "zh"
          ? "Chinese"
          : "English";

  const raw = await callChatCompletion(
    [
      {
        role: "system",
        content: `You are a professional ${langLabel} proofreader. Analyze the provided text for grammar, spelling, punctuation, and style errors.
Return a JSON object with exactly this structure:
{
  "corrections": [
    { "original": "original text with error", "suggested": "corrected text", "reason": "explanation of the error" }
  ],
  "improved_text": "the full text with all corrections applied"
}
Return only valid JSON, no markdown code blocks, no preamble.`,
      },
      {
        role: "user",
        content: `Please proofread the following text:\n\n${text}`,
      },
    ],
    { model: "gpt-4o-mini", temperature: 0.3, max_tokens: 2048 },
  );

  let corrections: Correction[] = [];
  let improved_text = text;

  try {
    const parsed = JSON.parse(raw);
    corrections = Array.isArray(parsed.corrections) ? parsed.corrections : [];
    improved_text =
      typeof parsed.improved_text === "string" ? parsed.improved_text : text;
  } catch {
    // If JSON parse fails, return empty corrections with original text
    corrections = [];
    improved_text = text;
  }

  return apiSuccess({ corrections, improved_text });
}
