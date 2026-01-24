-- =====================================================
-- RLSポリシー パフォーマンス最適化SQL
-- 
-- 問題: auth.uid() が各行ごとに再評価されている
-- 解決: auth.uid() を (SELECT auth.uid()) に変更
--       これにより1回だけ評価されるようになる
--
-- 機能への影響: なし（ロジックは完全に同一）
-- =====================================================

-- =====================================================
-- 1. group_members テーブル
-- =====================================================
DROP POLICY IF EXISTS "gm_select" ON group_members;
DROP POLICY IF EXISTS "gm_insert" ON group_members;
DROP POLICY IF EXISTS "gm_delete" ON group_members;

CREATE POLICY "gm_select" ON group_members
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "gm_insert" ON group_members
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "gm_delete" ON group_members
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- 2. split_groups テーブル
-- =====================================================
DROP POLICY IF EXISTS "sg_select" ON split_groups;
DROP POLICY IF EXISTS "sg_insert" ON split_groups;
DROP POLICY IF EXISTS "sg_update" ON split_groups;
DROP POLICY IF EXISTS "sg_delete" ON split_groups;

CREATE POLICY "sg_select" ON split_groups
  FOR SELECT USING (
    created_by = (SELECT auth.uid())
    OR id IN (SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "sg_insert" ON split_groups
  FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "sg_update" ON split_groups
  FOR UPDATE USING (created_by = (SELECT auth.uid()));

CREATE POLICY "sg_delete" ON split_groups
  FOR DELETE USING (created_by = (SELECT auth.uid()));

-- =====================================================
-- 3. group_invitations テーブル
-- =====================================================
DROP POLICY IF EXISTS "gi_select" ON group_invitations;
DROP POLICY IF EXISTS "gi_insert" ON group_invitations;
DROP POLICY IF EXISTS "gi_update" ON group_invitations;

CREATE POLICY "gi_select" ON group_invitations
  FOR SELECT USING (
    invited_by = (SELECT auth.uid())
    OR invited_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "gi_insert" ON group_invitations
  FOR INSERT WITH CHECK (invited_by = (SELECT auth.uid()));

CREATE POLICY "gi_update" ON group_invitations
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- =====================================================
-- 4. split_expenses テーブル
-- =====================================================
DROP POLICY IF EXISTS "se_select" ON split_expenses;
DROP POLICY IF EXISTS "se_insert" ON split_expenses;
DROP POLICY IF EXISTS "se_update" ON split_expenses;
DROP POLICY IF EXISTS "se_delete" ON split_expenses;

CREATE POLICY "se_select" ON split_expenses
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "se_insert" ON split_expenses
  FOR INSERT WITH CHECK (paid_by = (SELECT auth.uid()));

CREATE POLICY "se_update" ON split_expenses
  FOR UPDATE USING (paid_by = (SELECT auth.uid()));

CREATE POLICY "se_delete" ON split_expenses
  FOR DELETE USING (paid_by = (SELECT auth.uid()));

-- =====================================================
-- 5. expense_participants テーブル
-- =====================================================
DROP POLICY IF EXISTS "ep_select" ON expense_participants;
DROP POLICY IF EXISTS "ep_insert" ON expense_participants;
DROP POLICY IF EXISTS "ep_update" ON expense_participants;
DROP POLICY IF EXISTS "ep_delete" ON expense_participants;

CREATE POLICY "ep_select" ON expense_participants
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR expense_id IN (SELECT id FROM split_expenses WHERE paid_by = (SELECT auth.uid()))
  );

CREATE POLICY "ep_insert" ON expense_participants
  FOR INSERT WITH CHECK (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = (SELECT auth.uid()))
  );

CREATE POLICY "ep_update" ON expense_participants
  FOR UPDATE USING (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = (SELECT auth.uid()))
  );

CREATE POLICY "ep_delete" ON expense_participants
  FOR DELETE USING (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = (SELECT auth.uid()))
  );

-- =====================================================
-- 6. settlements テーブル
-- =====================================================
DROP POLICY IF EXISTS "st_select" ON settlements;
DROP POLICY IF EXISTS "st_insert" ON settlements;

CREATE POLICY "st_select" ON settlements
  FOR SELECT USING (
    from_user = (SELECT auth.uid()) OR to_user = (SELECT auth.uid())
  );

CREATE POLICY "st_insert" ON settlements
  FOR INSERT WITH CHECK (
    from_user = (SELECT auth.uid()) OR to_user = (SELECT auth.uid())
  );

-- =====================================================
-- 7. profiles テーブル
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of group members" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 自分のプロフィールまたは同じグループのメンバーのプロフィールを閲覧可能
CREATE POLICY "Users can view profiles of group members" ON profiles
  FOR SELECT USING (
    (SELECT auth.uid()) = id
    OR
    id IN (
      SELECT gm.user_id 
      FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- =====================================================
-- 変更内容まとめ:
-- 
-- 【変更箇所】
--   auth.uid() → (SELECT auth.uid())
--
-- 【対象テーブル・ポリシー数】
--   - group_members: 3ポリシー (gm_select, gm_insert, gm_delete)
--   - split_groups: 4ポリシー (sg_select, sg_insert, sg_update, sg_delete)
--   - group_invitations: 3ポリシー (gi_select, gi_insert, gi_update)
--   - split_expenses: 4ポリシー (se_select, se_insert, se_update, se_delete)
--   - expense_participants: 4ポリシー (ep_select, ep_insert, ep_update, ep_delete)
--   - settlements: 2ポリシー (st_select, st_insert)
--   - profiles: 3ポリシー (view, update, insert)
--
-- 【機能への影響】
--   なし。ロジックは完全に同一です。
--   パフォーマンスが向上するだけです。
--
-- 【なぜパフォーマンスが向上するか】
--   auth.uid() を直接呼び出すと、PostgreSQLは各行の評価時に
--   毎回この関数を呼び出します。
--   (SELECT auth.uid()) にすることで、PostgreSQLはこれを
--   「InitPlan」として認識し、クエリ開始時に1回だけ評価します。
-- =====================================================
