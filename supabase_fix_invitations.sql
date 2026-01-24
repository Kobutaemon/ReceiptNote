-- =====================================================
-- 招待機能の修正SQL
-- 招待されたユーザーがグループ情報を参照できるように修正
-- =====================================================

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON split_groups;
DROP POLICY IF EXISTS "Users can view invitations sent to them or by them" ON group_invitations;

-- split_groupsのSELECTポリシーを修正
-- 招待されたユーザーもグループ情報を見れるようにする
CREATE POLICY "Users can view groups they created or are members of or invited to" ON split_groups
  FOR SELECT USING (
    created_by = auth.uid()
    OR id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
    OR id IN (
      SELECT group_id FROM group_invitations 
      WHERE invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- group_invitationsのSELECTポリシーを修正
-- グループメンバーも招待一覧を見れるようにする
CREATE POLICY "Users can view invitations" ON group_invitations
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
    OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );
