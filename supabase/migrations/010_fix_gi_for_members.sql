-- =====================================================
-- group_invitations のSELECTポリシー修正
-- グループメンバーも招待履歴を見れるようにする
-- =====================================================

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "gi_select" ON group_invitations;

-- 修正版ポリシー
-- 招待者、招待された人、同じグループのメンバーが見れる
CREATE POLICY "gi_select" ON group_invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR invited_email = (auth.jwt() ->> 'email')
    OR group_id IN (SELECT get_user_group_ids())
  );
