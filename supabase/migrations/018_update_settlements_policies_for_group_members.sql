-- =====================================================
-- settlements のRLSを「精算に関わる人のみ」から
-- 「同じグループのメンバー全員が閲覧・登録できる」形に変更
-- 目的: 代表者が他メンバー分の精算を操作できるようにする
-- =====================================================

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "st_select" ON settlements;
DROP POLICY IF EXISTS "st_insert" ON settlements;

-- グループメンバーなら精算履歴を閲覧可能
CREATE POLICY "st_select" ON settlements
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- グループメンバーなら、誰と誰の間の精算でも登録可能
CREATE POLICY "st_insert" ON settlements
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid())
    )
  );

