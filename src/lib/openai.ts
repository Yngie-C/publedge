// ============================================================
// OpenAI Client Helper
// ============================================================

const OPENAI_BASE = "https://api.openai.com/v1";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  timeoutMs = 60000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) return res;

    // Retry on 429 / 5xx
    if ((res.status === 429 || res.status >= 500) && retries > 0) {
      const waitMs = res.status === 429 ? 2000 : 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      return fetchWithRetry(url, options, retries - 1, timeoutMs);
    }

    return res;
  } catch (err) {
    clearTimeout(timer);
    if (retries > 0 && (err as Error).name !== "AbortError") {
      await new Promise((r) => setTimeout(r, 1000));
      return fetchWithRetry(url, options, retries - 1, timeoutMs);
    }
    throw err;
  }
}

// ============================================================
// Chat Completion
// ============================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export async function callChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string> {
  const { model = "gpt-4o-mini", temperature = 0.7, max_tokens = 2048 } =
    options;

  const res = await fetchWithRetry(
    `${OPENAI_BASE}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    },
    2,
    60000,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI chat error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI chat");
  return content as string;
}

// ============================================================
// Image Generation (DALL-E)
// ============================================================

export interface ImageGenerationOptions {
  model?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  n?: number;
}

export async function callImageGeneration(
  prompt: string,
  options: ImageGenerationOptions = {},
): Promise<string> {
  const {
    model = "dall-e-3",
    size = "1024x1024",
    quality = "standard",
    n = 1,
  } = options;

  const res = await fetchWithRetry(
    `${OPENAI_BASE}/images/generations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, prompt, size, quality, n }),
    },
    1,
    120000,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI image error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const url = json.data?.[0]?.url;
  if (!url) throw new Error("No image URL returned from DALL-E");
  return url as string;
}

// ============================================================
// TTS
// ============================================================

export type TTSVoice =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer";

export async function callTTS(
  text: string,
  voice: TTSVoice = "alloy",
): Promise<Buffer> {
  const res = await fetchWithRetry(
    `${OPENAI_BASE}/audio/speech`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "tts-1", voice, input: text }),
    },
    2,
    60000,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI TTS error ${res.status}: ${text}`);
  }

  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
