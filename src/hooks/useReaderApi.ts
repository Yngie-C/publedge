import { useAuthStore } from "@/stores/auth-store";
import { useCallback, useRef } from "react";

/**
 * Returns a fetch wrapper that only executes when the user is authenticated.
 * Includes the Authorization header automatically via cookies (Supabase SSR).
 */
export function useAuthenticatedFetch() {
  const user = useAuthStore((s) => s.user);

  const authenticatedFetch = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers ?? {}),
        },
      });
    },
    [user]
  );

  return { authenticatedFetch, isAuthenticated: !!user, userId: user?.id };
}

/**
 * Returns a debounced save function.
 * The save is deferred by `delay` ms after the last call.
 */
export function useDebouncedSave<T>(
  saveFn: (data: T) => Promise<void>,
  delay: number = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);

  const debouncedSave = useCallback(
    (data: T) => {
      pendingRef.current = data;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(async () => {
        if (pendingRef.current !== null) {
          await saveFn(pendingRef.current);
          pendingRef.current = null;
        }
      }, delay);
    },
    [saveFn, delay]
  );

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current !== null) {
      await saveFn(pendingRef.current);
      pendingRef.current = null;
    }
  }, [saveFn]);

  return { debouncedSave, flush };
}
