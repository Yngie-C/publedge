import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { sanitizeContent } from "@/lib/sanitize";
import { marked } from "marked";
import mammoth from "mammoth";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "text/plain": "txt",
  "text/markdown": "md",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const SIZE_LIMITS: Record<string, number> = {
  txt: 5 * 1024 * 1024,  // 5MB
  md: 5 * 1024 * 1024,   // 5MB
  docx: 20 * 1024 * 1024, // 20MB
};

// Chapter split patterns
const CHAPTER_SPLIT_RE =
  /(?=<h[12][^>]*>)|(?=제\s*\d+\s*장)|(?=Chapter\s+\d+)/i;

interface ParsedChapter {
  title: string;
  content_html: string;
  content_raw: string;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function extractTitleFromHtml(html: string, index: number): string {
  const headingMatch = html.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
  if (headingMatch) {
    return headingMatch[1].replace(/<[^>]*>/g, "").trim();
  }
  const koreanMatch = html.match(/(제\s*\d+\s*장[^\n<]*)/);
  if (koreanMatch) return koreanMatch[1].trim();
  const englishMatch = html.match(/(Chapter\s+\d+[^\n<]*)/i);
  if (englishMatch) return englishMatch[1].trim();
  return `Chapter ${index + 1}`;
}

async function parseTxtToChapters(text: string): Promise<ParsedChapter[]> {
  const blocks = text.split(/\n\n+/);
  const htmlChunks: string[] = blocks
    .filter((b) => b.trim() !== "")
    .map((b) => `<p>${b.replace(/\n/g, "<br>")}</p>`);

  const fullHtml = htmlChunks.join("\n");
  return splitHtmlIntoChapters(fullHtml, text);
}

async function parseMdToChapters(text: string): Promise<ParsedChapter[]> {
  const html = await marked(text);
  return splitHtmlIntoChapters(html, text);
}

async function parseDocxToChapters(arrayBuffer: ArrayBuffer): Promise<ParsedChapter[]> {
  const result = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) });
  return splitHtmlIntoChapters(result.value, "");
}

function splitHtmlIntoChapters(html: string, rawText: string): ParsedChapter[] {
  const parts = html.split(CHAPTER_SPLIT_RE).filter((p) => p.trim() !== "");

  if (parts.length <= 1) {
    // No chapter splits found — treat as single chapter
    return [
      {
        title: "Chapter 1",
        content_html: sanitizeContent(html),
        content_raw: rawText,
      },
    ];
  }

  return parts.map((part, i) => ({
    title: extractTitleFromHtml(part, i),
    content_html: sanitizeContent(part),
    content_raw: part.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  }));
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("Expected multipart/form-data", "UPLOAD_ERROR", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return apiError("No file provided in form field 'file'", "UPLOAD_ERROR", 400);
  }

  const fileName =
    file instanceof File ? file.name : (formData.get("filename") as string) ?? "upload";
  const mimeType = file.type || "application/octet-stream";

  // MIME type validation
  if (!Object.keys(ALLOWED_MIME_TYPES).includes(mimeType)) {
    // Fallback: check extension
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !["txt", "md", "docx"].includes(ext)) {
      return apiError(
        "Unsupported file type. Allowed: .txt, .md, .docx",
        "UPLOAD_ERROR",
        415,
      );
    }
  }

  const ext =
    ALLOWED_MIME_TYPES[mimeType] ??
    (fileName.split(".").pop()?.toLowerCase() as string);

  // Size validation
  const limit = SIZE_LIMITS[ext] ?? SIZE_LIMITS["txt"];
  if (file.size > limit) {
    return apiError(
      `File too large. Limit for .${ext} is ${limit / (1024 * 1024)}MB`,
      "UPLOAD_ERROR",
      413,
    );
  }

  // Title from form or filename
  const bookTitle =
    (formData.get("title") as string | null)?.trim() ||
    fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

  const description = (formData.get("description") as string | null)?.trim() ?? null;
  const language = (formData.get("language") as string | null)?.trim() ?? "ko";

  // Parse file
  let chapters: ParsedChapter[];
  try {
    if (ext === "txt") {
      const text = await file.text();
      chapters = await parseTxtToChapters(text);
    } else if (ext === "md") {
      const text = await file.text();
      chapters = await parseMdToChapters(text);
    } else if (ext === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      chapters = await parseDocxToChapters(arrayBuffer);
    } else {
      return apiError("Unsupported file extension", "UPLOAD_ERROR", 415);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse file";
    return apiError(`File parsing failed: ${message}`, "UPLOAD_ERROR", 422);
  }

  if (chapters.length === 0) {
    return apiError("No content found in file", "UPLOAD_ERROR", 422);
  }

  const totalWords = chapters.reduce((sum, c) => sum + countWords(c.content_html), 0);
  const sourceType = ext === "txt" ? "text" : ext === "md" ? "markdown" : "docx";

  const supabase = await createClient();

  // Create book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      owner_id: user.id,
      title: bookTitle,
      description,
      language,
      source_type: sourceType,
      status: "draft",
      visibility: "private",
      total_chapters: chapters.length,
      total_words: totalWords,
    })
    .select()
    .single();

  if (bookError) return apiError(bookError.message, "SERVER_ERROR", 500);

  // Create chapters
  const chapterRows = chapters.map((c, i) => ({
    book_id: book.id,
    title: c.title,
    slug: `chapter-${i + 1}-${Date.now()}-${i}`,
    order_index: i,
    content_html: c.content_html,
    content_raw: c.content_raw || null,
    word_count: countWords(c.content_html),
  }));

  const { data: createdChapters, error: chaptersError } = await supabase
    .from("chapters")
    .insert(chapterRows)
    .select();

  if (chaptersError) {
    // Rollback book creation
    await supabase.from("books").delete().eq("id", book.id);
    return apiError(chaptersError.message, "SERVER_ERROR", 500);
  }

  return apiSuccess({ book, chapters: createdChapters }, 201);
}
