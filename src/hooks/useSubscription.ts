import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import type { Subscription, SubscriptionPlan } from "@/types/social";

const QUERY_KEY = ["subscription"];

async function fetchSubscription(): Promise<Subscription> {
  const res = await fetch("/api/subscription", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch subscription");
  const json = await res.json();
  return json.data;
}

async function updatePlan(plan: SubscriptionPlan): Promise<Subscription> {
  const res = await fetch("/api/subscription", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new Error("Failed to update subscription");
  const json = await res.json();
  return json.data;
}

export function useSubscription() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: QUERY_KEY,
    queryFn: fetchSubscription,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: (plan: SubscriptionPlan) => updatePlan(plan),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEY, updated);
    },
  });

  /**
   * Returns true if the user has remaining TTS quota.
   */
  function canUseTts(): boolean {
    if (!subscription) return false;
    return subscription.tts_used_this_month < subscription.tts_monthly_limit;
  }

  /**
   * Returns remaining TTS conversions this month.
   */
  function remainingTts(): number {
    if (!subscription) return 0;
    return Math.max(
      0,
      subscription.tts_monthly_limit - subscription.tts_used_this_month,
    );
  }

  /**
   * Returns true if the given storage amount (in MB) is within the limit.
   */
  function hasStorageFor(additionalMb: number): boolean {
    if (!subscription) return false;
    // We don't track actual usage in the current schema, so check limit > 0
    return subscription.storage_limit_mb >= additionalMb;
  }

  return {
    subscription,
    isLoading,
    updatePlan: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    canUseTts,
    remainingTts,
    hasStorageFor,
  };
}
