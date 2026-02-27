import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import type { SubscriptionPlan } from "@/types/social";

const DEFAULT_LIMITS: Record<
  SubscriptionPlan,
  { tts_monthly_limit: number; storage_limit_mb: number }
> = {
  free: { tts_monthly_limit: 3, storage_limit_mb: 100 },
  basic: { tts_monthly_limit: 15, storage_limit_mb: 1000 },
  premium: { tts_monthly_limit: 50, storage_limit_mb: 5000 },
  enterprise: { tts_monthly_limit: 200, storage_limit_mb: 50000 },
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return apiError(fetchError.message, "SERVER_ERROR", 500);
  }

  if (existing) {
    return apiSuccess(existing);
  }

  // Create free tier subscription if none exists
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: created, error: createError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan: "free",
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      tts_monthly_limit: 3,
      tts_used_this_month: 0,
      storage_limit_mb: 100,
    })
    .select()
    .single();

  if (createError) return apiError(createError.message, "SERVER_ERROR", 500);

  return apiSuccess(created, 201);
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { plan } = body;
  const validPlans: SubscriptionPlan[] = ["free", "basic", "premium", "enterprise"];

  if (!plan || !validPlans.includes(plan as SubscriptionPlan)) {
    return apiError(
      "plan must be one of: free, basic, premium, enterprise",
      "VALIDATION_ERROR",
      400,
    );
  }

  const typedPlan = plan as SubscriptionPlan;
  const limits = DEFAULT_LIMITS[typedPlan];

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan: typedPlan,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        tts_monthly_limit: limits.tts_monthly_limit,
        storage_limit_mb: limits.storage_limit_mb,
        tts_used_this_month: 0,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data);
}
