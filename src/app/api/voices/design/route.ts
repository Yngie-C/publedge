import { apiError, apiSuccess, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
import { getTtsProvider } from "@/lib/tts";

const PREVIEW_TEXT = "안녕하세요, 이 목소리로 오디오북을 만들어 보세요.";
const MAX_INSTRUCTIONS_CHARS = 3200;

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  let body: { name: string; instructions: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { name, instructions, language = "ko" } = body;

  if (!name || !name.trim()) {
    return apiError("목소리 이름을 입력해주세요.", "VALIDATION_ERROR", 400);
  }

  if (!instructions || !instructions.trim()) {
    return apiError("목소리 설명을 입력해주세요.", "VALIDATION_ERROR", 400);
  }

  if (instructions.length > MAX_INSTRUCTIONS_CHARS) {
    return apiError(
      `목소리 설명은 ${MAX_INSTRUCTIONS_CHARS}자 이내로 입력해주세요.`,
      "VALIDATION_ERROR",
      400
    );
  }

  const supabase = await createClient();

  // Generate preview audio using Voice Design
  const provider = getTtsProvider("qwen3");
  let previewAudio: Uint8Array;
  try {
    previewAudio = await provider.generateAudio(PREVIEW_TEXT, "Sohee", {
      instructions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "목소리 생성에 실패했습니다.";
    return apiError(message, "SERVER_ERROR", 500);
  }

  // Create the custom voice record first to get the ID
  const { data: voice, error: insertError } = await supabase
    .from("custom_voices")
    .insert({
      user_id: user.id,
      name: name.trim(),
      type: "designed",
      voice_provider: "qwen3",
      instructions: instructions.trim(),
      language,
    })
    .select()
    .single();

  if (insertError || !voice) {
    return apiError("목소리 저장에 실패했습니다.", "SERVER_ERROR", 500);
  }

  // Upload preview audio
  const previewPath = `voices/${user.id}/${voice.id}/preview.mp3`;
  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(previewPath, Buffer.from(previewAudio), {
      contentType: "audio/mpeg",
      upsert: true,
    });

  let previewUrl: string | null = null;
  if (!uploadError) {
    const { data: urlData } = supabase.storage
      .from("audio")
      .getPublicUrl(previewPath);
    previewUrl = urlData.publicUrl;
  }

  // Update with preview URL
  if (previewUrl) {
    await supabase
      .from("custom_voices")
      .update({ preview_audio_url: previewUrl })
      .eq("id", voice.id);
  }

  return apiSuccess({
    id: voice.id,
    name: voice.name,
    type: voice.type,
    instructions: voice.instructions,
    language: voice.language,
    preview_audio_url: previewUrl,
    created_at: voice.created_at,
  }, 201);
}
