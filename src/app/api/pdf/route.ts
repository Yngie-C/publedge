import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError } from "@/lib/api-utils";
import { BookPDF } from "@/lib/pdf-generator";
import type { Book, Chapter } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return apiError("bookId query parameter is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const user = await getAuthUser();

  // Fetch book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }

  // Authorization: must own book OR book is public+published
  const isOwner = user && book.owner_id === user.id;
  const isPublicPublished =
    book.visibility === "public" && book.status === "published";

  if (!isOwner && !isPublicPublished) {
    if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);
    return apiError("Access denied", "FORBIDDEN", 403);
  }

  // Fetch chapters ordered by order_index
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });

  if (chaptersError) {
    return apiError("Failed to fetch chapters", "SERVER_ERROR", 500);
  }

  // Fetch author display name
  let authorName = "Unknown Author";
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", book.owner_id)
    .single();

  if (profile?.display_name) {
    authorName = profile.display_name;
  }

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    const element = createElement(BookPDF, {
      book: book as Book,
      chapters: (chapters ?? []) as Chapter[],
      authorName,
    }) as ReactElement<DocumentProps>;
    pdfBuffer = await renderToBuffer(element);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return apiError(`PDF generation failed: ${message}`, "SERVER_ERROR", 500);
  }

  const safeTitle = book.title
    .replace(/[^a-zA-Z0-9가-힣\s-_]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);

  const filename = `${safeTitle || "book"}.pdf`;

  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength,
  );

  return new Response(arrayBuffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": pdfBuffer.byteLength.toString(),
      "Cache-Control": "no-store",
    },
  });
}
