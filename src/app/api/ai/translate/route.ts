import { NextRequest } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { callChatCompletion } from "@/lib/openai";

const MAX_INPUT_CHARS = 50000;
const SUPPORTED_LANGUAGES = ["ko", "en", "ja", "zh"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json().catch(() => null);
  if (!body?.text) {
    return apiError("text is required", "VALIDATION_ERROR", 400);
  }

  const {
    text,
    source_language,
    target_language,
  } = body as {
    text: string;
    source_language: string;
    target_language: string;
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

  if (!SUPPORTED_LANGUAGES.includes(source_language as SupportedLanguage)) {
    return apiError(
      `source_language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  if (!SUPPORTED_LANGUAGES.includes(target_language as SupportedLanguage)) {
    return apiError(
      `target_language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  if (source_language === target_language) {
    return apiSuccess({
      translated_text: text,
      source_language,
      target_language,
    });
  }

  const srcName = LANGUAGE_NAMES[source_language as SupportedLanguage];
  const tgtName = LANGUAGE_NAMES[target_language as SupportedLanguage];

  const translated_text = await callChatCompletion(
    [
      {
        role: "system",
        content: `You are a professional translator. Translate the provided text from ${srcName} to ${tgtName}. Preserve formatting, tone, and meaning as closely as possible. Respond only with the translated text, no preamble or explanation.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    { model: "gpt-4o-mini", temperature: 0.3, max_tokens: 4096 },
  );

  return apiSuccess({ translated_text, source_language, target_language });
}
