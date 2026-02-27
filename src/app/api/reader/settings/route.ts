import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import type { ReaderPreferences, ReaderTheme } from "@/types";

const VALID_THEMES: ReaderTheme[] = ["light", "dark", "sepia"];

function validatePreferences(prefs: unknown): prefs is ReaderPreferences {
  if (!prefs || typeof prefs !== "object") return false;
  const p = prefs as Record<string, unknown>;
  if (typeof p.fontSize !== "number" || p.fontSize < 10 || p.fontSize > 32) return false;
  if (!VALID_THEMES.includes(p.theme as ReaderTheme)) return false;
  if (typeof p.lineHeight !== "number" || p.lineHeight < 1 || p.lineHeight > 3) return false;
  return true;
}

export async function GET(_request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reader_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return apiError(error.message, "SERVER_ERROR", 500);
  }

  // Return default settings if none exist
  if (!data) {
    return apiSuccess({
      user_id: user.id,
      preferences: {
        fontSize: 16,
        theme: "light" as ReaderTheme,
        lineHeight: 1.6,
      },
    });
  }

  return apiSuccess(data);
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { preferences?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  if (!validatePreferences(body.preferences)) {
    return apiError(
      "preferences must include fontSize (10-32), theme (light|dark|sepia), and lineHeight (1-3)",
      "VALIDATION_ERROR",
      400,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reader_settings")
    .upsert(
      {
        user_id: user.id,
        preferences: body.preferences,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data);
}
