-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. books
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  language TEXT DEFAULT 'ko',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'processing', 'published', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'unlisted', 'public')),
  source_type TEXT NOT NULL DEFAULT 'text'
    CHECK (source_type IN ('text', 'markdown', 'docx')),
  source_file_url TEXT,
  total_chapters INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. chapters
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  content_html TEXT NOT NULL CHECK (length(content_html) <= 500000),
  content_raw TEXT,
  word_count INTEGER DEFAULT 0,
  estimated_reading_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id, slug)
);

-- 4. reading_progress
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  page_number INTEGER DEFAULT 0,
  total_pages INTEGER,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 5. highlights
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  selected_text TEXT NOT NULL,
  prefix_context TEXT,
  suffix_context TEXT,
  note TEXT,
  color TEXT DEFAULT 'yellow',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id, chapter_id, page_number)
);

-- 7. reader_settings
CREATE TABLE reader_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{"fontSize": 18, "theme": "light", "lineHeight": 1.6}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_books_owner ON books(owner_id);
CREATE INDEX idx_books_status_visibility ON books(status, visibility);
CREATE INDEX idx_books_status_visibility_published ON books(status, visibility, published_at);
CREATE INDEX idx_chapters_book ON chapters(book_id, order_index);
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_highlights_user_book ON highlights(user_id, book_id);
CREATE INDEX idx_highlights_user_book_chapter ON highlights(user_id, book_id, chapter_id);
CREATE INDEX idx_bookmarks_user_book ON bookmarks(user_id, book_id);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reader_settings ENABLE ROW LEVEL SECURITY;

-- user_profiles RLS
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- books RLS
CREATE POLICY "Users can view own books" ON books FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can view public published books" ON books FOR SELECT USING (visibility = 'public' AND status = 'published');
CREATE POLICY "Users can insert own books" ON books FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own books" ON books FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own books" ON books FOR DELETE USING (auth.uid() = owner_id);

-- chapters RLS (inherit from book)
CREATE POLICY "Users can view chapters of own books" ON chapters FOR SELECT USING (EXISTS (SELECT 1 FROM books WHERE books.id = chapters.book_id AND books.owner_id = auth.uid()));
CREATE POLICY "Users can view chapters of public books" ON chapters FOR SELECT USING (EXISTS (SELECT 1 FROM books WHERE books.id = chapters.book_id AND books.visibility = 'public' AND books.status = 'published'));
CREATE POLICY "Users can insert chapters to own books" ON chapters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM books WHERE books.id = chapters.book_id AND books.owner_id = auth.uid()));
CREATE POLICY "Users can update chapters of own books" ON chapters FOR UPDATE USING (EXISTS (SELECT 1 FROM books WHERE books.id = chapters.book_id AND books.owner_id = auth.uid()));
CREATE POLICY "Users can delete chapters of own books" ON chapters FOR DELETE USING (EXISTS (SELECT 1 FROM books WHERE books.id = chapters.book_id AND books.owner_id = auth.uid()));

-- reading_progress RLS
CREATE POLICY "Users can manage own reading progress" ON reading_progress FOR ALL USING (auth.uid() = user_id);

-- highlights RLS
CREATE POLICY "Users can manage own highlights" ON highlights FOR ALL USING (auth.uid() = user_id);

-- bookmarks RLS
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- reader_settings RLS
CREATE POLICY "Users can manage own reader settings" ON reader_settings FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON reading_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reader_settings_updated_at BEFORE UPDATE ON reader_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
