-- =====================================================
-- split_expenses の paid_by をゲスト対応に変更
-- 
-- 目的:
--   「誰かから誰かへ」モードで「もらう人」にゲストを
--   指定できるようにする。paid_by は auth.users を参照する
--   FOREIGN KEY のため、ゲストの場合は paid_by = NULL にし、
--   代わりに paid_by_guest_name に名前を保存する。
--
-- 変更:
--   1. paid_by を NULLable に変更
--   2. paid_by_guest_name カラム追加
--   3. CHECK 制約: paid_by か paid_by_guest_name のどちらかは必須
--   4. se_update / se_delete ポリシー修正（ゲスト支払の場合は
--      グループメンバーなら操作可能に）
-- =====================================================

-- 1. paid_by を NULLable に変更
ALTER TABLE split_expenses
  ALTER COLUMN paid_by DROP NOT NULL;

-- 2. ゲスト支払者名カラム追加
ALTER TABLE split_expenses
  ADD COLUMN IF NOT EXISTS paid_by_guest_name TEXT;

-- 3. paid_by か paid_by_guest_name のどちらかは必須
ALTER TABLE split_expenses
  ADD CONSTRAINT se_paid_by_or_guest
  CHECK (paid_by IS NOT NULL OR paid_by_guest_name IS NOT NULL);

-- 4. se_update ポリシー修正
--    ゲスト支払（paid_by IS NULL）の場合はグループメンバーなら更新可
DROP POLICY IF EXISTS "se_update" ON split_expenses;

CREATE POLICY "se_update" ON split_expenses
  FOR UPDATE USING (
    paid_by = (SELECT auth.uid())
    OR (paid_by IS NULL AND group_id IN (
      SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid())
    ))
  );

-- 5. se_delete ポリシー修正
--    ゲスト支払（paid_by IS NULL）の場合はグループメンバーなら削除可
DROP POLICY IF EXISTS "se_delete" ON split_expenses;

CREATE POLICY "se_delete" ON split_expenses
  FOR DELETE USING (
    paid_by = (SELECT auth.uid())
    OR (paid_by IS NULL AND group_id IN (
      SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid())
    ))
  );

-- =====================================================
-- 変更内容まとめ:
--
-- 【split_expenses】
--   - paid_by: NOT NULL → NULLable
--   - paid_by_guest_name TEXT (NULLable) 追加
--   - CHECK: paid_by OR paid_by_guest_name が必須
--   - se_update: paid_by = auth.uid() OR (ゲスト AND グループメンバー)
--   - se_delete: paid_by = auth.uid() OR (ゲスト AND グループメンバー)
--
-- 【既存データへの影響】
--   既存の行はすべて paid_by が NOT NULL のため
--   新しい CHECK 制約に違反せず、安全に適用可能
-- =====================================================
