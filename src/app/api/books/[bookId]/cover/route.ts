import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";

type Params = { params: Promise<{ bookId: string }> };

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;
  const supabase = await createClient();

  // Verify ownership
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("owner_id, cover_image_url")
    .eq("id", bookId)
    .single();

  if (bookError || !book) return apiError("Book not found", "NOT_FOUND", 404);
  if (book.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("Expected multipart/form-data", "UPLOAD_ERROR", 400);
  }

  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return apiError("No image provided in form field 'image'", "UPLOAD_ERROR", 400);
  }

  // Validate MIME type
  const mimeType = file.type;
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return apiError(
      "Invalid file type. Allowed: JPEG, PNG, WebP",
      "UPLOAD_ERROR",
      415,
    );
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return apiError("Image too large. Maximum size is 5MB", "UPLOAD_ERROR", 413);
  }

  const ext = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
  const filename = `${Date.now()}.${ext}`;
  const storagePath = `covers/${bookId}/${filename}`;

  // Remove previous cover if it exists
  if (book.cover_image_url) {
    try {
      // Extract path from URL: everything after /storage/v1/object/public/covers/
      const url = new URL(book.cover_image_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/covers/");
      if (pathParts.length === 2) {
        await supabase.storage.from("covers").remove([pathParts[1]]);
      }
    } catch {
      // Ignore errors when removing old cover
    }
  }

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("covers")
    .upload(storagePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    return apiError(`Upload failed: ${uploadError.message}`, "UPLOAD_ERROR", 500);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("covers")
    .getPublicUrl(storagePath);

  const coverUrl = urlData.publicUrl;

  // Update book record
  const { data: updatedBook, error: updateError } = await supabase
    .from("books")
    .update({ cover_image_url: coverUrl, updated_at: new Date().toISOString() })
    .eq("id", bookId)
    .select()
    .single();

  if (updateError) {
    return apiError(updateError.message, "SERVER_ERROR", 500);
  }

  return apiSuccess({ cover_image_url: coverUrl, book: updatedBook }, 200);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;
  const supabase = await createClient();

  // Verify ownership
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("owner_id, cover_image_url")
    .eq("id", bookId)
    .single();

  if (bookError || !book) return apiError("Book not found", "NOT_FOUND", 404);
  if (book.owner_id !== user.id) return apiError("Access denied", "FORBIDDEN", 403);

  if (!book.cover_image_url) {
    return apiSuccess({ deleted: false, message: "No cover image to delete" });
  }

  // Remove from Storage
  try {
    const url = new URL(book.cover_image_url);
    const pathParts = url.pathname.split("/storage/v1/object/public/covers/");
    if (pathParts.length === 2) {
      await supabase.storage.from("covers").remove([pathParts[1]]);
    }
  } catch {
    // Continue even if storage removal fails
  }

  // Clear the cover_image_url
  const { error: updateError } = await supabase
    .from("books")
    .update({ cover_image_url: null, updated_at: new Date().toISOString() })
    .eq("id", bookId);

  if (updateError) {
    return apiError(updateError.message, "SERVER_ERROR", 500);
  }

  return apiSuccess({ deleted: true });
}
