import { apiError, apiSuccess, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
import { getTtsProvider } from "@/lib/tts";

const PREVIEW_TEXT = "안녕하세요, 이 목소리로 오디오북을 만들어 보세요.";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DURATION_SECONDS = 3;
const MAX_DURATION_SECONDS = 30;

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  let body: {
    name: string;
    ref_audio: string; // base64
    ref_text: string;
    language?: string;
    consent_confirmed: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { name, ref_audio, ref_text, language = "ko", consent_confirmed } = body;

  // Validate consent
  if (!consent_confirmed) {
    return apiError(
      "음성 사용 권한 확인이 필요합니다.",
      "VALIDATION_ERROR",
      400
    );
  }

  if (!name || !name.trim()) {
    return apiError("목소리 이름을 입력해주세요.", "VALIDATION_ERROR", 400);
  }

  if (!ref_audio) {
    return apiError("참조 음성 파일을 업로드해주세요.", "VALIDATION_ERROR", 400);
  }

  if (!ref_text || !ref_text.trim()) {
    return apiError("참조 음성의 텍스트를 입력해주세요.", "VALIDATION_ERROR", 400);
  }

  // Decode base64 audio
  let audioBuffer: Buffer;
  try {
    // Handle data URL format: "data:audio/wav;base64,..." or raw base64
    const base64Data = ref_audio.includes(",")
      ? ref_audio.split(",")[1]
      : ref_audio;
    audioBuffer = Buffer.from(base64Data, "base64");
  } catch {
    return apiError("음성 파일 디코딩에 실패했습니다.", "VALIDATION_ERROR", 400);
  }

  // Validate file size
  if (audioBuffer.length > MAX_FILE_SIZE) {
    return apiError(
      "음성 파일은 10MB 이하여야 합니다.",
      "VALIDATION_ERROR",
      400
    );
  }

  // Duration estimation based on file format (from data URL MIME type)
  const mimeMatch = ref_audio.match(/^data:(audio\/\w+)/);
  const mimeType = mimeMatch?.[1] ?? "audio/wav";
  let estimatedDuration: number;

  if (mimeType === "audio/wav" || mimeType === "audio/wave") {
    // WAV: (fileSize - 44 header) / (sampleRate * bytesPerSample)
    // Conservative estimate with 16kHz, 16-bit mono
    estimatedDuration = (audioBuffer.length - 44) / (16000 * 2);
  } else {
    // MP3/M4A: estimate ~16kB/sec for 128kbps compressed audio
    estimatedDuration = audioBuffer.length / 16000;
  }

  if (estimatedDuration < MIN_DURATION_SECONDS) {
    return apiError(
      `음성 파일은 최소 ${MIN_DURATION_SECONDS}초 이상이어야 합니다.`,
      "VALIDATION_ERROR",
      400
    );
  }

  const supabase = await createClient();

  // Create the custom voice record first to get the ID
  const { data: voice, error: insertError } = await supabase
    .from("custom_voices")
    .insert({
      user_id: user.id,
      name: name.trim(),
      type: "cloned",
      voice_provider: "qwen3",
      ref_text: ref_text.trim(),
      consent_confirmed: true,
      language,
    })
    .select()
    .single();

  if (insertError || !voice) {
    return apiError("목소리 저장에 실패했습니다.", "SERVER_ERROR", 500);
  }

  // Upload reference audio to storage
  const refAudioPath = `voices/${user.id}/${voice.id}/ref.wav`;
  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(refAudioPath, audioBuffer, {
      contentType: "audio/wav",
      upsert: true,
    });

  if (uploadError) {
    // Clean up the voice record
    await supabase.from("custom_voices").delete().eq("id", voice.id);
    return apiError("참조 음성 업로드에 실패했습니다.", "SERVER_ERROR", 500);
  }

  const { data: refUrlData } = supabase.storage
    .from("audio")
    .getPublicUrl(refAudioPath);
  const refAudioUrl = refUrlData.publicUrl;

  // Update voice record with ref_audio_url
  await supabase
    .from("custom_voices")
    .update({ ref_audio_url: refAudioUrl })
    .eq("id", voice.id);

  // Generate preview audio using Voice Cloning
  const provider = getTtsProvider("qwen3");
  let previewAudio: Uint8Array;
  let previewUrl: string | null = null;

  try {
    previewAudio = await provider.generateAudio(PREVIEW_TEXT, "Sohee", {
      refAudioUrl,
      refText: ref_text.trim(),
    });

    // Upload preview
    const previewPath = `voices/${user.id}/${voice.id}/preview.mp3`;
    const { error: previewUploadError } = await supabase.storage
      .from("audio")
      .upload(previewPath, Buffer.from(previewAudio), {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (!previewUploadError) {
      const { data: previewUrlData } = supabase.storage
        .from("audio")
        .getPublicUrl(previewPath);
      previewUrl = previewUrlData.publicUrl;

      await supabase
        .from("custom_voices")
        .update({ preview_audio_url: previewUrl })
        .eq("id", voice.id);
    }
  } catch (err) {
    // Preview generation failed, but the voice record is saved
    console.error("Voice clone preview generation failed:", err);
  }

  return apiSuccess({
    id: voice.id,
    name: voice.name,
    type: voice.type,
    ref_audio_url: refAudioUrl,
    ref_text: voice.ref_text,
    language: voice.language,
    preview_audio_url: previewUrl,
    consent_confirmed: true,
    created_at: voice.created_at,
  }, 201);
}
