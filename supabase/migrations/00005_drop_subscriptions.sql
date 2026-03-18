-- ============================================================
-- Phase 5: Drop Legacy Subscriptions Table
-- 구독 시스템 폐지 - 테이블 삭제
-- ============================================================

-- Drop subscriptions table (no longer used after sales platform transition)
DROP TABLE IF EXISTS subscriptions CASCADE;
