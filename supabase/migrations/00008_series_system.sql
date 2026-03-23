-- ============================================================
-- Series / 연재 시스템 스키마 확장
-- Linear Issue: SUN-68
-- ============================================================

BEGIN;

-- ============================================================
-- Step 1: books 테이블에 content_type 추가
-- ============================================================
ALTER TABLE books ADD COLUMN content_type TEXT NOT NULL DEFAULT 'book'
  CHECK (content_type IN ('book', 'series'));

CREATE INDEX idx_books_content_type ON books(content_type);

-- ============================================================
-- Step 2: chapters 테이블에 status + published_at 추가
-- 기존 챕터는 모두 'published' 상태로 설정
-- ============================================================
ALTER TABLE chapters ADD COLUMN status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published'));
ALTER TABLE chapters ADD COLUMN published_at TIMESTAMPTZ;

-- 기존 챕터 데이터 보정: 모두 published 상태 + published_at 설정
UPDATE chapters SET status = 'published' WHERE status IS NULL;
UPDATE chapters SET published_at = created_at WHERE published_at IS NULL;

CREATE INDEX idx_chapters_published_at ON chapters(published_at);
CREATE INDEX idx_chapters_status ON chapters(book_id, status);

-- ============================================================
-- Step 3: chapters RLS 정책 업데이트 (draft 챕터 보호)
-- 반드시 Step 2의 기존 데이터 UPDATE 이후에 실행
-- ============================================================
-- 기존 소유자 전용 정책 제거 (새 정책에 소유자 조건 포함)
DROP POLICY IF EXISTS "Users can view chapters of own books" ON chapters;
-- 기존 접근 정책 제거 (구매자 조건 포함 버전으로 재생성)
DROP POLICY IF EXISTS "Users can view chapters of accessible books" ON chapters;

CREATE POLICY "Users can view published chapters of accessible books" ON chapters
  FOR SELECT USING (
    -- 소유자는 모든 챕터(draft 포함) 조회 가능
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
      AND books.owner_id = auth.uid()
    )
    OR
    -- 비소유자는 published 챕터만 + 기존 접근 조건(무료/구매자) 유지
    (
      chapters.status = 'published'
      AND EXISTS (
        SELECT 1 FROM books
        WHERE books.id = chapters.book_id
        AND books.visibility = 'public'
        AND books.status = 'published'
        AND (
          books.price = 0
          OR EXISTS (
            SELECT 1 FROM purchases
            WHERE purchases.book_id = books.id
            AND purchases.user_id = auth.uid()
            AND purchases.status = 'completed'
          )
        )
      )
    )
  );

-- ============================================================
-- Step 4: series_metadata 테이블
-- ============================================================
CREATE TABLE series_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  series_status TEXT NOT NULL DEFAULT 'ongoing'
    CHECK (series_status IN ('ongoing', 'hiatus', 'completed')),
  schedule_day TEXT CHECK (schedule_day IN ('mon','tue','wed','thu','fri','sat','sun')),
  schedule_description TEXT,
  last_chapter_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id)
);

-- series_metadata RLS
ALTER TABLE series_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view series metadata of public series" ON series_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = series_metadata.book_id
      AND books.visibility = 'public'
      AND books.status = 'published'
    )
  );

CREATE POLICY "Owners can manage their series metadata" ON series_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = series_metadata.book_id
      AND books.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_series_metadata_book ON series_metadata(book_id);

-- ============================================================
-- Step 5: series_subscriptions 테이블
-- FK가 series_metadata(book_id)를 참조하여 content_type='series'인 books에만 구독 가능
-- ============================================================
CREATE TABLE series_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES series_metadata(book_id) ON DELETE CASCADE,
  notify_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, series_id)
);

-- series_subscriptions RLS
ALTER TABLE series_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions" ON series_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Series owners can view subscriber count" ON series_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = series_subscriptions.series_id
      AND books.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_series_subscriptions_user ON series_subscriptions(user_id);
CREATE INDEX idx_series_subscriptions_series ON series_subscriptions(series_id);

-- ============================================================
-- Step 6: notifications 테이블 (인앱 알림)
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_chapter', 'series_complete', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 복합 인덱스: 읽지 않은 알림 조회 최적화 (가장 빈번한 쿼리)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- Step 7: updated_at 트리거 (기존 패턴 따름)
-- ============================================================
CREATE TRIGGER update_series_metadata_updated_at
  BEFORE UPDATE ON series_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
