-- =====================================================
-- group_members のSELECTポリシー修正
-- SECURITY DEFINER関数を使って無限再帰を回避
-- =====================================================

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "gm_select" ON group_members;

-- ユーザーが所属するグループIDを返す関数を作成
-- SECURITY DEFINER により RLS をバイパスして実行
CREATE OR REPLACE FUNCTION get_user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
$$;

-- 修正版ポリシー（関数を使用して無限再帰を回避）
CREATE POLICY "gm_select" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT get_user_group_ids())
  );
