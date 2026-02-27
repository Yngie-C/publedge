export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  // joined
  user_profile?: { display_name: string; avatar_url: string | null };
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type SubscriptionPlan = "free" | "basic" | "premium" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  tts_monthly_limit: number;
  tts_used_this_month: number;
  storage_limit_mb: number;
  created_at: string;
  updated_at: string;
}

export type CollaboratorRole = "editor" | "viewer" | "commenter";

export interface Collaborator {
  id: string;
  book_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string | null;
  accepted: boolean;
  created_at: string;
  user_profile?: { display_name: string; avatar_url: string | null };
}

export interface PlanFeatures {
  name: string;
  price: number; // monthly USD
  ttsLimit: number;
  storageMb: number;
  features: string[];
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    name: "무료",
    price: 0,
    ttsLimit: 3,
    storageMb: 100,
    features: ["전자책 5권", "TTS 월 3권", "100MB 저장공간"],
  },
  basic: {
    name: "베이직",
    price: 9.99,
    ttsLimit: 15,
    storageMb: 1000,
    features: ["전자책 무제한", "TTS 월 15권", "1GB 저장공간", "PDF 내보내기"],
  },
  premium: {
    name: "프리미엄",
    price: 19.99,
    ttsLimit: 50,
    storageMb: 5000,
    features: [
      "전자책 무제한",
      "TTS 월 50권",
      "5GB 저장공간",
      "EPUB 내보내기",
      "AI 보조 기능",
      "협업",
    ],
  },
  enterprise: {
    name: "엔터프라이즈",
    price: 49.99,
    ttsLimit: 200,
    storageMb: 50000,
    features: [
      "모든 기능",
      "TTS 월 200권",
      "50GB 저장공간",
      "우선 지원",
      "API 액세스",
    ],
  },
};
