import { NextRequest } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { callImageGeneration } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

type CoverStyle = "modern" | "classic" | "minimalist" | "illustration";

const STYLE_PROMPTS: Record<CoverStyle, string> = {
  modern:
    "modern, clean design with bold typography, contemporary book cover, sleek and professional",
  classic:
    "classic literary style, elegant and timeless design, traditional book cover with refined aesthetics",
  minimalist:
    "minimalist design, simple and clean, lots of white space, subtle design elements",
  illustration:
    "illustrated book cover, artistic illustration, vibrant colors, hand-crafted art style",
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json().catch(() => null);
  if (!body?.title) {
    return apiError("title is required", "VALIDATION_ERROR", 400);
  }

  const {
    title,
    description = "",
    style = "modern",
    book_id,
  } = body as {
    title: string;
    description?: string;
    style?: string;
    book_id?: string;
  };

  const coverStyle = (
    ["modern", "classic", "minimalist", "illustration"].includes(style)
      ? style
      : "modern"
  ) as CoverStyle;

  const styleDesc = STYLE_PROMPTS[coverStyle];
  const descPart = description
    ? ` The book is about: ${description.slice(0, 200)}.`
    : "";

  const prompt = `Book cover for "${title}".${descPart} Style: ${styleDesc}. High quality book cover artwork, suitable for digital publishing.`;

  const imageUrl = await callImageGeneration(prompt, {
    model: "dall-e-3",
    size: "1024x1024",
    quality: "standard",
  });

  // Download the image and upload to Supabase Storage
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    return apiError("Failed to download generated image", "SERVER_ERROR", 500);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = await createClient();
  const fileName = `covers/${user.id}/${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    return apiError(
      `Storage upload failed: ${uploadError.message}`,
      "UPLOAD_ERROR",
      500,
    );
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(fileName);

  const cover_url = urlData.publicUrl;

  // If book_id provided, update the book's cover_image_url
  if (book_id) {
    await supabase
      .from("books")
      .update({ cover_image_url: cover_url })
      .eq("id", book_id)
      .eq("owner_id", user.id);
  }

  return apiSuccess({ cover_url });
}
