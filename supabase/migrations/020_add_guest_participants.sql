-- =====================================================
-- ゲスト参加者対応
-- 
-- 目的:
--   サイト未登録のユーザーを「ゲスト」として名前のみで
--   支出の参加者・精算対象に追加できるようにする。
--
-- 変更テーブル:
--   1. expense_participants: guest_name カラム追加、user_id NULLable化
--   2. settlements: from_guest_name / to_guest_name 追加、from_user / to_user NULLable化
-- =====================================================

-- =====================================================
-- 1. expense_participants の変更
-- =====================================================

-- ゲスト名カラム追加
ALTER TABLE expense_participants 
  ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- user_id を NULLable に変更（ゲスト参加者の場合は NULL）
ALTER TABLE expense_participants 
  ALTER COLUMN user_id DROP NOT NULL;

-- user_id か guest_name のどちらかは必須
ALTER TABLE expense_participants 
  ADD CONSTRAINT ep_user_or_guest 
  CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL);

-- 既存の UNIQUE 制約を削除し、条件付きインデックスに変更
-- （user_id が NULL のゲスト行でも正しく重複チェックできるように）
ALTER TABLE expense_participants 
  DROP CONSTRAINT IF EXISTS expense_participants_expense_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ep_expense_user 
  ON expense_participants(expense_id, user_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ep_expense_guest 
  ON expense_participants(expense_id, guest_name) 
  WHERE guest_name IS NOT NULL;

-- =====================================================
-- 2. settlements の変更
-- =====================================================

-- ゲスト名カラム追加（精算の from/to にゲストを指定可能に）
ALTER TABLE settlements 
  ADD COLUMN IF NOT EXISTS from_guest_name TEXT;

ALTER TABLE settlements 
  ADD COLUMN IF NOT EXISTS to_guest_name TEXT;

-- from_user / to_user を NULLable に変更
ALTER TABLE settlements 
  ALTER COLUMN from_user DROP NOT NULL;

ALTER TABLE settlements 
  ALTER COLUMN to_user DROP NOT NULL;

-- from 側: user_id か guest_name のどちらかは必須
ALTER TABLE settlements 
  ADD CONSTRAINT st_from_user_or_guest 
  CHECK (from_user IS NOT NULL OR from_guest_name IS NOT NULL);

-- to 側: user_id か guest_name のどちらかは必須
ALTER TABLE settlements 
  ADD CONSTRAINT st_to_user_or_guest 
  CHECK (to_user IS NOT NULL OR to_guest_name IS NOT NULL);

-- =====================================================
-- 変更内容まとめ:
--
-- 【expense_participants】
--   - guest_name TEXT (NULLable) 追加
--   - user_id: NOT NULL → NULLable
--   - CHECK: user_id OR guest_name が必須
--   - UNIQUE: 条件付きインデックスに変更
--
-- 【settlements】
--   - from_guest_name TEXT (NULLable) 追加
--   - to_guest_name TEXT (NULLable) 追加
--   - from_user: NOT NULL → NULLable
--   - to_user: NOT NULL → NULLable
--   - CHECK: from側/to側それぞれ user OR guest が必須
--
-- 【既存データへの影響】
--   既存の行はすべて user_id / from_user / to_user が NOT NULL のため
--   新しい CHECK 制約に違反せず、安全に適用可能
-- =====================================================
