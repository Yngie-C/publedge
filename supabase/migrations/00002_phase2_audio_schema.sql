-- audiobooks table
CREATE TABLE audiobooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  voice_provider TEXT NOT NULL DEFAULT 'openai',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id, voice_id)
);

-- audio_chapters table
CREATE TABLE audio_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  audio_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(audiobook_id, chapter_id)
);

-- listening_progress table
CREATE TABLE listening_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audiobook_id UUID NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id),
  position_seconds DECIMAL(10,2) DEFAULT 0,
  playback_speed DECIMAL(3,2) DEFAULT 1.00,
  last_listened_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, audiobook_id)
);

-- Indexes
CREATE INDEX idx_audiobooks_book ON audiobooks(book_id);
CREATE INDEX idx_audio_chapters_audiobook ON audio_chapters(audiobook_id);
CREATE INDEX idx_audio_chapters_status ON audio_chapters(audiobook_id, status);
CREATE INDEX idx_listening_progress_user ON listening_progress(user_id);

-- RLS
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_progress ENABLE ROW LEVEL SECURITY;

-- audiobooks: owner of the book can manage
CREATE POLICY "Users can view own audiobooks" ON audiobooks FOR SELECT
  USING (EXISTS (SELECT 1 FROM books WHERE books.id = audiobooks.book_id AND books.owner_id = auth.uid()));
CREATE POLICY "Users can view public audiobooks" ON audiobooks FOR SELECT
  USING (EXISTS (SELECT 1 FROM books WHERE books.id = audiobooks.book_id AND books.visibility = 'public' AND books.status = 'published'));
CREATE POLICY "Users can insert audiobooks for own books" ON audiobooks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM books WHERE books.id = audiobooks.book_id AND books.owner_id = auth.uid()));
CREATE POLICY "Users can update own audiobooks" ON audiobooks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM books WHERE books.id = audiobooks.book_id AND books.owner_id = auth.uid()));
CREATE POLICY "Users can delete own audiobooks" ON audiobooks FOR DELETE
  USING (EXISTS (SELECT 1 FROM books WHERE books.id = audiobooks.book_id AND books.owner_id = auth.uid()));

-- audio_chapters: inherit from audiobook->book ownership
CREATE POLICY "Users can view own audio chapters" ON audio_chapters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM audiobooks
    JOIN books ON books.id = audiobooks.book_id
    WHERE audiobooks.id = audio_chapters.audiobook_id
      AND books.owner_id = auth.uid()
  ));
CREATE POLICY "Users can view public audio chapters" ON audio_chapters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM audiobooks
    JOIN books ON books.id = audiobooks.book_id
    WHERE audiobooks.id = audio_chapters.audiobook_id
      AND books.visibility = 'public'
      AND books.status = 'published'
  ));

-- listening_progress: user's own
CREATE POLICY "Users can manage own listening progress" ON listening_progress FOR ALL USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_audiobooks_updated_at BEFORE UPDATE ON audiobooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listening_progress_updated_at BEFORE UPDATE ON listening_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
