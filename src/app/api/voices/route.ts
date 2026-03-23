import { apiError, apiSuccess, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

const PRESET_VOICES = [
  { id: "Sohee", label: "소희", description: "따뜻하고 감성적인 한국어 여성", lang: "ko", type: "preset" as const },
  { id: "Chelsie", label: "Chelsie", description: "Friendly and warm English female", lang: "en", type: "preset" as const },
  { id: "Ethan", label: "Ethan", description: "Calm and steady English male", lang: "en", type: "preset" as const },
  { id: "Cherry", label: "Cherry", description: "Bright and cheerful female", lang: "en", type: "preset" as const },
  { id: "Serena", label: "Serena", description: "Elegant and refined female", lang: "en", type: "preset" as const },
  { id: "Aura", label: "Aura", description: "Soft and soothing female", lang: "en", type: "preset" as const },
];

export { PRESET_VOICES };

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const supabase = await createClient();

  const { data: customVoices, error } = await supabase
    .from("custom_voices")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("Failed to fetch custom voices", "SERVER_ERROR", 500);
  }

  const custom = (customVoices ?? []).map((v: Record<string, unknown>) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    voice_provider: v.voice_provider,
    instructions: v.instructions,
    language: v.language,
    preview_audio_url: v.preview_audio_url,
    created_at: v.created_at,
  }));

  return apiSuccess({
    preset: PRESET_VOICES,
    custom,
  });
}
