import { createClient } from "@/lib/supabase/server";
import lamejs from "lamejs";

// ============================================================
// HTML stripping
// ============================================================

export function stripHtmlToText(html: string): string {
  // Remove script and style blocks entirely
  let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Replace block-level tags with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|br|tr|blockquote)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Collapse excessive whitespace/newlines
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

// ============================================================
// Text chunking at sentence boundaries
// ============================================================

export function splitTextIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  // Split on sentence-ending punctuation followed by whitespace or end
  const sentenceEnders = /(?<=[.?!。])\s+/g;

  let remaining = text;
  while (remaining.length > maxChars) {
    // Find all sentence boundary positions within the allowed window
    let splitAt = -1;
    let match: RegExpExecArray | null;
    sentenceEnders.lastIndex = 0;
    const window = remaining.slice(0, maxChars + 1);
    const re = /(?<=[.?!。])\s+/g;
    while ((match = re.exec(window)) !== null) {
      if (match.index <= maxChars) {
        splitAt = match.index + match[0].length;
      }
    }

    if (splitAt <= 0) {
      // No sentence boundary found — hard split at maxChars on word boundary
      splitAt = remaining.lastIndexOf(" ", maxChars);
      if (splitAt <= 0) splitAt = maxChars;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks.filter((c) => c.length > 0);
}

// ============================================================
// Provider abstraction
// ============================================================

export interface TtsOptions {
  customVoiceId?: string;
  instructions?: string;   // For Voice Design (qwen3-tts-instruct-flash)
  refAudioUrl?: string;    // For Voice Cloning
  refText?: string;        // For Voice Cloning
}

export interface TtsProvider {
  generateAudio(text: string, voiceId: string, options?: TtsOptions): Promise<Uint8Array>;
}

// ============================================================
// WAV → MP3 conversion (lamejs, 24kHz mono 16-bit)
// ============================================================

function wavToMp3(wavData: Uint8Array): Uint8Array {
  // Skip WAV header (44 bytes)
  const samples = new Int16Array(wavData.buffer, wavData.byteOffset + 44);
  const mp3Encoder = new lamejs.Mp3Encoder(1, 24000, 128); // mono, 24kHz, 128kbps
  const maxSamples = 1152;
  const mp3Chunks: Uint8Array[] = [];

  for (let i = 0; i < samples.length; i += maxSamples) {
    const chunk = samples.subarray(i, Math.min(i + maxSamples, samples.length));
    const mp3buf = mp3Encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Chunks.push(new Uint8Array(mp3buf));
    }
  }

  const end = mp3Encoder.flush();
  if (end.length > 0) {
    mp3Chunks.push(new Uint8Array(end));
  }

  // Concatenate all chunks
  const totalLength = mp3Chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of mp3Chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// ============================================================
// OpenAI TTS provider
// ============================================================

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_TTS_MODEL = "tts-1";

export class OpenAiTtsProvider implements TtsProvider {
  async generateAudio(
    text: string,
    voiceId: string,
    _options?: TtsOptions
  ): Promise<Uint8Array> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    const response = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_TTS_MODEL,
        voice: voiceId,
        input: text,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI TTS API error ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}

// ============================================================
// Qwen3 TTS provider (DashScope)
// ============================================================

const DASHSCOPE_TTS_URL =
  "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

// 180 RPM = 3 req/sec → min 333ms between requests
const QWEN_MIN_INTERVAL_MS = 333;

export class QwenTtsProvider implements TtsProvider {
  private lastRequestTime = 0;

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < QWEN_MIN_INTERVAL_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, QWEN_MIN_INTERVAL_MS - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  async generateAudio(
    text: string,
    voiceId: string,
    options?: TtsOptions
  ): Promise<Uint8Array> {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error("DASHSCOPE_API_KEY environment variable is required");
    }

    // Determine model and extra parameters based on options
    let model = "qwen3-tts";
    const parameters: Record<string, unknown> = { voice: voiceId };

    if (options?.instructions) {
      model = "qwen3-tts-instruct-flash";
      parameters.instructions = options.instructions;
    } else if (options?.refAudioUrl && options?.refText) {
      model = "qwen3-tts-vc-2026-01-22";
      // Fetch ref audio and encode as base64
      const refResponse = await fetch(options.refAudioUrl);
      if (!refResponse.ok) {
        throw new Error(
          `Failed to fetch reference audio: ${refResponse.status}`
        );
      }
      const refBuffer = await refResponse.arrayBuffer();
      const refBase64 = Buffer.from(refBuffer).toString("base64");
      parameters.ref_audio = refBase64;
      parameters.ref_text = options.refText;
    }

    const body = {
      model,
      input: { text },
      parameters,
    };

    // Retry with exponential backoff on 429
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }

      await this.throttle();

      const response = await fetch(DASHSCOPE_TTS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        lastError = new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        let parsed: { code?: string; message?: string } = {};
        try {
          parsed = JSON.parse(errText);
        } catch {
          // ignore parse error
        }

        const code = parsed.code ?? "";
        if (code === "Throttling") {
          lastError = new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
          continue;
        } else if (code === "InvalidParameter") {
          throw new Error("잘못된 파라미터입니다.");
        } else {
          throw new Error(
            `TTS 생성 실패: ${parsed.message ?? `HTTP ${response.status}`}`
          );
        }
      }

      // Parse response JSON to extract base64 WAV audio
      const json = (await response.json()) as {
        output?: { audio?: string };
      };

      const audioBase64 = json.output?.audio;
      if (!audioBase64) {
        throw new Error("TTS 생성 실패: 응답에 오디오 데이터가 없습니다.");
      }

      const wavBytes = new Uint8Array(Buffer.from(audioBase64, "base64"));
      return wavToMp3(wavBytes);
    }

    throw lastError ?? new Error("TTS 생성 실패: 최대 재시도 횟수를 초과했습니다.");
  }
}

// ============================================================
// Provider factory
// ============================================================

export function getTtsProvider(provider: string): TtsProvider {
  switch (provider) {
    case "openai":
      return new OpenAiTtsProvider();
    case "qwen3":
      return new QwenTtsProvider();
    default:
      throw new Error(`Unsupported TTS provider: ${provider}`);
  }
}

// ============================================================
// Storage upload
// ============================================================

export async function uploadAudioChunk(
  bookId: string,
  chapterId: string,
  chunkIndex: number,
  audioBuffer: Buffer
): Promise<string> {
  const supabase = await createClient();
  const path = `audiobooks/${bookId}/${chapterId}/chunk-${chunkIndex}.mp3`;

  const { error } = await supabase.storage
    .from("audio")
    .upload(path, audioBuffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("audio")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ============================================================
// Full chapter TTS orchestration
// ============================================================

export interface ProcessChapterTTSParams {
  chapterId: string;
  audiobookId: string;
  bookId: string;
  contentHtml: string;
  voice: string;
  provider: string;
  customVoiceId?: string;
  instructions?: string;
  refAudioUrl?: string;
  refText?: string;
}

export async function processChapterTTS(
  params: ProcessChapterTTSParams
): Promise<void> {
  const {
    chapterId,
    audiobookId,
    bookId,
    contentHtml,
    voice,
    provider,
    customVoiceId,
    instructions,
    refAudioUrl,
    refText,
  } = params;

  const supabase = await createClient();

  // Mark as processing + record attempt
  await supabase
    .from("audio_chapters")
    .update({
      status: "processing",
      last_attempted_at: new Date().toISOString(),
    })
    .eq("audiobook_id", audiobookId)
    .eq("chapter_id", chapterId);

  try {
    const ttsProvider = getTtsProvider(provider);
    const ttsOptions: TtsOptions = { customVoiceId, instructions, refAudioUrl, refText };

    const plainText = stripHtmlToText(contentHtml);
    const chunks = splitTextIntoChunks(plainText, 4096);

    const chunkUrls: string[] = [];
    let totalBytes = 0;
    let totalDuration = 0;

    for (let i = 0; i < chunks.length; i++) {
      const start = Date.now();
      let mp3Buffer: Uint8Array;
      let status: "success" | "error" = "success";
      const voiceId = customVoiceId ?? voice;
      let model = provider === "openai" ? OPENAI_TTS_MODEL : "qwen3-tts";
      if (instructions) model = "qwen3-tts-instruct-flash";
      else if (refAudioUrl && refText) model = "qwen3-tts-vc-2026-01-22";

      try {
        mp3Buffer = await ttsProvider.generateAudio(chunks[i], voiceId, ttsOptions);
      } catch (err) {
        status = "error";
        const latencyMs = Date.now() - start;
        console.log(
          JSON.stringify({
            event: "tts_generate",
            provider,
            model,
            voiceId,
            chunkIndex: i,
            latencyMs,
            status,
          })
        );
        throw err;
      }

      const latencyMs = Date.now() - start;
      console.log(
        JSON.stringify({
          event: "tts_generate",
          provider,
          model,
          voiceId,
          chunkIndex: i,
          latencyMs,
          status,
        })
      );

      const url = await uploadAudioChunk(
        bookId,
        chapterId,
        i,
        Buffer.from(mp3Buffer)
      );
      chunkUrls.push(url);
      totalBytes += mp3Buffer.length;
      // Rough estimate: ~128 kbps MP3, 16000 bytes/sec
      totalDuration += Math.ceil(mp3Buffer.length / 16000);
    }

    await supabase
      .from("audio_chapters")
      .update({
        status: "completed",
        audio_url: chunkUrls.join(","),
        duration_seconds: totalDuration,
        file_size_bytes: totalBytes,
        error_message: null,
      })
      .eq("audiobook_id", audiobookId)
      .eq("chapter_id", chapterId);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    // Fetch current retry_count
    const { data: currentRow } = await supabase
      .from("audio_chapters")
      .select("retry_count")
      .eq("audiobook_id", audiobookId)
      .eq("chapter_id", chapterId)
      .single();

    const retryCount = (currentRow?.retry_count ?? 0) + 1;
    const newStatus = retryCount >= 3 ? "failed" : "pending";

    await supabase
      .from("audio_chapters")
      .update({
        status: newStatus,
        error_message: errorMessage,
        retry_count: retryCount,
      })
      .eq("audiobook_id", audiobookId)
      .eq("chapter_id", chapterId);

    if (newStatus === "failed") {
      throw err;
    }
  }
}
