import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'kakao') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      }

      // auth 상태 변경 리스너
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          set({ user: session.user });
          const { data } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (data) {
            set({ profile: data as UserProfile });
          } else {
            const displayName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "";
            await supabase.from("user_profiles").insert({
              user_id: session.user.id,
              display_name: displayName,
            });
            await get().fetchProfile();
          }
        } else if (event === "SIGNED_OUT") {
          set({ user: null, profile: null });
        }
      });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signUp: async ({ email, password, displayName }) => {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) return { error: error.message };

    if (data.user) {
      // user_profiles 생성
      await supabase.from("user_profiles").insert({
        user_id: data.user.id,
        display_name: displayName || null,
      });
    }

    return {};
  },

  signIn: async (email, password) => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    return {};
  },

  signInWithOAuth: async (provider) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      set({ profile: data as UserProfile });
    }
  },
}));
