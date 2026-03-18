-- ============================================================
-- Phase 4: Sales Platform Schema
-- 판매 플랫폼 전환을 위한 스키마 변경
-- ============================================================

-- 1. books 테이블 확장: 가격 관련 컬럼 추가
ALTER TABLE books ADD COLUMN price INTEGER DEFAULT 0;  -- KRW 단위, 0 = 무료
ALTER TABLE books ADD COLUMN is_free BOOLEAN GENERATED ALWAYS AS (price = 0) STORED;

-- 2. purchases 테이블: 구매 기록
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  price_paid INTEGER NOT NULL,  -- 실제 결제 금액 (KRW)
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 3. payment_transactions 테이블: Toss Payments 연동 기록
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  toss_payment_key TEXT UNIQUE,
  toss_order_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'in_progress', 'done', 'canceled', 'partial_canceled', 'aborted', 'expired')),
  method TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_book ON purchases(book_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_book ON payment_transactions(book_id);
CREATE INDEX idx_payment_transactions_order ON payment_transactions(toss_order_id);
CREATE INDEX idx_books_price ON books(price);
CREATE INDEX idx_books_is_free ON books(is_free);

-- 5. RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- purchases RLS: 사용자는 자신의 구매만 조회, 판매자는 자신의 책 구매 조회
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Book owners can view purchases of their books" ON purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM books WHERE books.id = purchases.book_id AND books.owner_id = auth.uid())
  );

-- payment_transactions RLS
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON payment_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. chapters RLS 수정: 구매자도 챕터에 접근 가능하도록
-- 기존 정책 삭제 후 새 정책 생성
DROP POLICY IF EXISTS "Users can view chapters of public books" ON chapters;
CREATE POLICY "Users can view chapters of accessible books" ON chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
      AND books.visibility = 'public'
      AND books.status = 'published'
      AND (
        books.price = 0
        OR books.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM purchases
          WHERE purchases.book_id = books.id
          AND purchases.user_id = auth.uid()
          AND purchases.status = 'completed'
        )
      )
    )
  );

-- 7. updated_at trigger for payment_transactions
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
