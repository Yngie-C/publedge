-- SUN-67: 하이라이트 소셜 공유 기능
-- Phase 1: DB 스키마 확장 + RLS 정책 분리

-- 1. highlights 테이블에 공유 관련 컬럼 추가
ALTER TABLE highlights ADD COLUMN share_token TEXT UNIQUE;
ALTER TABLE highlights ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE highlights ADD COLUMN shared_at TIMESTAMPTZ;

-- 2. highlight_share_events 테이블 신규 생성
CREATE TABLE highlight_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  referrer TEXT,
  viewer_ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 인덱스
CREATE INDEX idx_highlights_share_token ON highlights(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_share_events_highlight ON highlight_share_events(highlight_id);
CREATE INDEX idx_share_events_created ON highlight_share_events(created_at);

-- 4. RLS 정책 분리 재작성 (기존 FOR ALL → 개별 정책)
DROP POLICY IF EXISTS "Users can manage own highlights" ON highlights;

CREATE POLICY "highlights_select_own"
  ON highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "highlights_select_public"
  ON highlights FOR SELECT
  USING (is_public = true AND share_token IS NOT NULL);

CREATE POLICY "highlights_insert_own"
  ON highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "highlights_update_own"
  ON highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "highlights_delete_own"
  ON highlights FOR DELETE
  USING (auth.uid() = user_id);

-- 5. highlights 테이블 anon SELECT 권한 (공개 하이라이트 조회용)
GRANT SELECT ON highlights TO anon;

-- 6. highlight_share_events RLS 정책
ALTER TABLE highlight_share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_events_select_own"
  ON highlight_share_events FOR SELECT
  USING (
    highlight_id IN (
      SELECT id FROM highlights WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "share_events_insert_anon"
  ON highlight_share_events FOR INSERT
  WITH CHECK (true);

GRANT INSERT ON highlight_share_events TO anon;
GRANT SELECT ON highlight_share_events TO authenticated;
