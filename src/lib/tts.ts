import { createClient } from "@/lib/supabase/server";

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
// OpenAI TTS call
// ============================================================

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_TTS_MODEL = "tts-1";

export async function generateTTSAudio(
  text: string,
  voice: string,
  provider: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Return a minimal valid MP3 silence buffer as placeholder
    // 32-byte minimal MP3 header (silent frame)
    const placeholder = Buffer.from(
      "fffb9000000000000000000000000000000000000000000000000000000000000000",
      "hex"
    );
    return placeholder;
  }

  if (provider !== "openai") {
    throw new Error(`Unsupported TTS provider: ${provider}`);
  }

  const response = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice,
      input: text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `OpenAI TTS API error ${response.status}: ${errText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
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

interface ProcessChapterTTSParams {
  chapterId: string;
  audiobookId: string;
  bookId: string;
  contentHtml: string;
  voice: string;
  provider: string;
}

export async function processChapterTTS(
  params: ProcessChapterTTSParams
): Promise<void> {
  const { chapterId, audiobookId, bookId, contentHtml, voice, provider } =
    params;
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
    const plainText = stripHtmlToText(contentHtml);
    const chunks = splitTextIntoChunks(plainText, 4096);

    const chunkUrls: string[] = [];
    let totalBytes = 0;
    let totalDuration = 0;

    for (let i = 0; i < chunks.length; i++) {
      const audioBuffer = await generateTTSAudio(chunks[i], voice, provider);
      const url = await uploadAudioChunk(bookId, chapterId, i, audioBuffer);
      chunkUrls.push(url);
      totalBytes += audioBuffer.length;
      // Rough estimate: ~128 kbps MP3, 16000 bytes/sec
      totalDuration += Math.ceil(audioBuffer.length / 16000);
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
