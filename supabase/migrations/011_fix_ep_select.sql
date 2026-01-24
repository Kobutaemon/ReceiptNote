-- =====================================================
-- expense_participants のSELECTポリシー修正
-- グループメンバー全員が参加者情報を見れるようにする
-- =====================================================

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "ep_select" ON expense_participants;

-- 修正版ポリシー
-- 同じグループのメンバーなら参加者情報を見れる
CREATE POLICY "ep_select" ON expense_participants
  FOR SELECT USING (
    expense_id IN (
      SELECT id FROM split_expenses 
      WHERE group_id IN (SELECT get_user_group_ids())
    )
  );
