// ============================================================
// Publedge Core Types
// ============================================================

// --- User ---
export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// --- Book ---
export type BookStatus = "draft" | "processing" | "published" | "archived";
export type BookVisibility = "private" | "unlisted" | "public";
export type SourceType = "text" | "markdown" | "docx";

export interface Book {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  language: string;
  status: BookStatus;
  visibility: BookVisibility;
  source_type: SourceType;
  source_file_url: string | null;
  total_chapters: number;
  total_words: number;
  published_at: string | null;
  price: number;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

// --- Chapter ---
export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  slug: string;
  order_index: number;
  content_html: string;
  content_raw: string | null;
  word_count: number;
  estimated_reading_time: number | null;
  created_at: string;
  updated_at: string;
}

// --- Audiobook ---
export type AudioStatus = "pending" | "processing" | "completed" | "failed";

export interface Audiobook {
  id: string;
  book_id: string;
  voice_id: string;
  voice_provider: string;
  status: AudioStatus;
  total_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface AudioChapter {
  id: string;
  audiobook_id: string;
  chapter_id: string;
  audio_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  status: AudioStatus;
  error_message: string | null;
  retry_count: number;
  last_attempted_at: string | null;
  created_at: string;
}

// --- Reader ---
export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string;
  page_number: number;
  total_pages: number | null;
  percentage: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string;
  selected_text: string;
  prefix_context: string | null;
  suffix_context: string | null;
  note: string | null;
  color: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string;
  page_number: number;
  note: string | null;
  created_at: string;
}

export type ReaderTheme = "light" | "dark" | "sepia";

export interface ReaderPreferences {
  fontSize: number;
  theme: ReaderTheme;
  lineHeight: number;
}

export interface ReaderSettings {
  id: string;
  user_id: string;
  preferences: ReaderPreferences;
  created_at: string;
  updated_at: string;
}

// --- Listening ---
export interface ListeningProgress {
  id: string;
  user_id: string;
  audiobook_id: string;
  chapter_id: string | null;
  position_seconds: number;
  playback_speed: number;
  last_listened_at: string;
  created_at: string;
  updated_at: string;
}

// --- Content Block (리더기용) ---
export interface ContentBlock {
  type: "paragraph" | "heading" | "list" | "blockquote" | "code" | "image" | "html";
  content: string;
  level?: number; // heading level
}

// --- API ---
export interface ApiError {
  error: string;
  code: string;
}

export interface ApiSuccess<T> {
  data: T;
}

// --- TOC ---
export interface TOCItem {
  id: string;
  title: string;
  slug: string;
  order_index: number;
}

// --- Purchase ---
export type PurchaseStatus = "pending" | "completed" | "refunded" | "failed";

export interface Purchase {
  id: string;
  user_id: string;
  book_id: string;
  price_paid: number;
  payment_method: string | null;
  status: PurchaseStatus;
  purchased_at: string;
  created_at: string;
}

// --- Payment Transaction ---
export type PaymentTransactionStatus =
  | "ready"
  | "in_progress"
  | "done"
  | "canceled"
  | "partial_canceled"
  | "aborted"
  | "expired";

export interface PaymentTransaction {
  id: string;
  purchase_id: string | null;
  user_id: string;
  book_id: string;
  toss_payment_key: string | null;
  toss_order_id: string;
  amount: number;
  status: PaymentTransactionStatus;
  method: string | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// --- Access Control ---
export type AccessReason = "owner" | "purchased" | "free" | "none";

export interface BookAccessResult {
  hasAccess: boolean;
  reason: AccessReason;
}
