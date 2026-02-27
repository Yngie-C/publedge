// This is a Supabase Edge Function stub for TTS processing
// In production, this would be triggered by a Database Webhook
// when audio_chapters records are inserted

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_TTS_MODEL = "tts-1";
const MAX_CHUNK_CHARS = 4096;
const MAX_RETRIES = 3;

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: AudioChapterRecord;
  old_record: AudioChapterRecord | null;
  schema: string;
}

interface AudioChapterRecord {
  id: string;
  audiobook_id: string;
  chapter_id: string;
  audio_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  retry_count: number;
  last_attempted_at: string | null;
  created_at: string;
}

interface AudiobookRecord {
  id: string;
  book_id: string;
  voice_id: string;
  voice_provider: string;
  status: string;
}

interface ChapterRecord {
  id: string;
  book_id: string;
  title: string;
  content_html: string;
  order_index: number;
}

// ---- HTML stripping ----
function stripHtmlToText(html: string): string {
  let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  text = text.replace(/<\/(p|div|h[1-6]|li|br|tr|blockquote)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

// ---- Text chunking ----
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars + 1);
    let splitAt = -1;
    const re = /(?<=[.?!。])\s+/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(window)) !== null) {
      if (match.index <= maxChars) {
        splitAt = match.index + match[0].length;
      }
    }

    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf(" ", maxChars);
      if (splitAt <= 0) splitAt = maxChars;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks.filter((c) => c.length > 0);
}

// ---- OpenAI TTS ----
async function generateTTSAudio(
  text: string,
  voice: string,
  apiKey: string
): Promise<Uint8Array> {
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
    throw new Error(`OpenAI TTS error ${response.status}: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

serve(async (req: Request) => {
  // Validate webhook secret
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only process INSERT events on audio_chapters with pending status
  if (
    payload.type !== "INSERT" ||
    payload.table !== "audio_chapters" ||
    payload.record.status !== "pending"
  ) {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const audioChapter = payload.record;

  // Fetch audiobook to get voice settings
  const { data: audiobook, error: audiobookError } = await supabase
    .from("audiobooks")
    .select("id, book_id, voice_id, voice_provider, status")
    .eq("id", audioChapter.audiobook_id)
    .single<AudiobookRecord>();

  if (audiobookError || !audiobook) {
    console.error("Failed to fetch audiobook:", audiobookError);
    return new Response(
      JSON.stringify({ error: "Audiobook not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch chapter content
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, book_id, title, content_html, order_index")
    .eq("id", audioChapter.chapter_id)
    .single<ChapterRecord>();

  if (chapterError || !chapter) {
    console.error("Failed to fetch chapter:", chapterError);
    return new Response(
      JSON.stringify({ error: "Chapter not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Mark as processing
  await supabase
    .from("audio_chapters")
    .update({
      status: "processing",
      last_attempted_at: new Date().toISOString(),
    })
    .eq("id", audioChapter.id);

  try {
    const plainText = stripHtmlToText(chapter.content_html);
    const chunks = splitTextIntoChunks(plainText, MAX_CHUNK_CHARS);

    const chunkUrls: string[] = [];
    let totalBytes = 0;
    let totalDuration = 0;

    for (let i = 0; i < chunks.length; i++) {
      let audioData: Uint8Array;

      if (openaiApiKey) {
        audioData = await generateTTSAudio(
          chunks[i],
          audiobook.voice_id,
          openaiApiKey
        );
      } else {
        // Placeholder: minimal silent MP3 frame
        audioData = new Uint8Array([
          0xff, 0xfb, 0x90, 0x00, ...new Array(28).fill(0),
        ]);
      }

      // Upload to Supabase Storage
      const storagePath = `audiobooks/${audiobook.book_id}/${chapter.id}/chunk-${i}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(storagePath, audioData, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(storagePath);

      chunkUrls.push(urlData.publicUrl);
      totalBytes += audioData.length;
      // Rough duration estimate: 128 kbps => ~16000 bytes/sec
      totalDuration += Math.ceil(audioData.length / 16000);
    }

    // Mark chapter as completed
    await supabase
      .from("audio_chapters")
      .update({
        status: "completed",
        audio_url: chunkUrls.join(","),
        duration_seconds: totalDuration,
        file_size_bytes: totalBytes,
        error_message: null,
      })
      .eq("id", audioChapter.id);

    // Check if all chapters for the audiobook are done
    const { data: remainingChapters } = await supabase
      .from("audio_chapters")
      .select("id, status")
      .eq("audiobook_id", audiobook.id)
      .in("status", ["pending", "processing"]);

    if (!remainingChapters || remainingChapters.length === 0) {
      // All done — compute total duration
      const { data: allChapters } = await supabase
        .from("audio_chapters")
        .select("duration_seconds, status")
        .eq("audiobook_id", audiobook.id);

      const aggregateDuration = allChapters?.reduce(
        (sum, c) => sum + (c.duration_seconds ?? 0),
        0
      ) ?? 0;

      const anyFailed = allChapters?.some((c) => c.status === "failed");

      await supabase
        .from("audiobooks")
        .update({
          status: anyFailed ? "failed" : "completed",
          total_duration_seconds: aggregateDuration > 0 ? aggregateDuration : null,
        })
        .eq("id", audiobook.id);
    }

    return new Response(
      JSON.stringify({ success: true, chunkUrls }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("TTS processing error:", errorMessage);

    const newRetryCount = (audioChapter.retry_count ?? 0) + 1;
    const newStatus = newRetryCount >= MAX_RETRIES ? "failed" : "pending";

    await supabase
      .from("audio_chapters")
      .update({
        status: newStatus,
        error_message: errorMessage,
        retry_count: newRetryCount,
      })
      .eq("id", audioChapter.id);

    if (newStatus === "failed") {
      // Check if all chapters are now in terminal states
      const { data: remainingActive } = await supabase
        .from("audio_chapters")
        .select("id")
        .eq("audiobook_id", audiobook.id)
        .in("status", ["pending", "processing"]);

      if (!remainingActive || remainingActive.length === 0) {
        await supabase
          .from("audiobooks")
          .update({ status: "failed" })
          .eq("id", audiobook.id);
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage, retry_count: newRetryCount }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
