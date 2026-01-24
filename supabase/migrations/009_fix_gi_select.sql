-- =====================================================
-- group_invitations の SELECT/UPDATEポリシー修正
-- auth.users ではなく auth.jwt() を使用
-- =====================================================

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "gi_select" ON group_invitations;
DROP POLICY IF EXISTS "gi_update" ON group_invitations;

-- 修正版ポリシー（auth.jwt()を使用してメールを取得）
CREATE POLICY "gi_select" ON group_invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR invited_email = (auth.jwt() ->> 'email')
  );

CREATE POLICY "gi_update" ON group_invitations
  FOR UPDATE USING (
    invited_email = (auth.jwt() ->> 'email')
  );
