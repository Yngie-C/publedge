import { apiError, apiSuccess, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { id } = await params;

  if (!id) {
    return apiError("Voice ID is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  // Soft delete: set is_active = false (existing audiobooks retain their audio files)
  const { error } = await supabase
    .from("custom_voices")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return apiError("목소리 삭제에 실패했습니다.", "SERVER_ERROR", 500);
  }

  return apiSuccess({ deleted: true });
}
