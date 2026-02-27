import { useAuthStore } from "@/stores/auth-store";
import type { ReaderPreferences, ReaderSettings } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const DEFAULTS: ReaderPreferences = {
  fontSize: 18,
  theme: "light",
  lineHeight: 1.6,
};

async function fetchSettings(): Promise<ReaderPreferences> {
  const res = await fetch("/api/reader/settings", {
    credentials: "include",
  });
  if (!res.ok) return DEFAULTS;
  const json = await res.json();
  const settings = json.data as ReaderSettings | null;
  return settings?.preferences ?? DEFAULTS;
}

async function saveSettings(preferences: ReaderPreferences): Promise<void> {
  const res = await fetch("/api/reader/settings", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferences }),
  });
  if (!res.ok) throw new Error("Failed to save settings");
}

export function useReaderSettings() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["reader-settings"];

  const { data: preferences = DEFAULTS, isLoading } =
    useQuery<ReaderPreferences>({
      queryKey,
      queryFn: fetchSettings,
      enabled: !!user,
      staleTime: 1000 * 60 * 30,
    });

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<ReaderPreferences>(queryKey);
      queryClient.setQueryData<ReaderPreferences>(queryKey, newPrefs);
      return { previous };
    },
    onError: (_err, _newPrefs, context) => {
      if (context?.previous) {
        queryClient.setQueryData<ReaderPreferences>(queryKey, context.previous);
      }
    },
  });

  const updateSettings = useCallback(
    (partial: Partial<ReaderPreferences>) => {
      const next = { ...preferences, ...partial };
      saveMutation.mutate(next);
    },
    [preferences, saveMutation]
  );

  return {
    preferences,
    isLoading,
    updateSettings,
    isSaving: saveMutation.isPending,
  };
}
