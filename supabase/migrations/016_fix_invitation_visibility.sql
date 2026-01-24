-- =====================================================
-- auth.users テーブルへの直接アクセスを修正
-- 
-- 問題: 
--   RLSポリシーで auth.users テーブルにアクセスしているが、
--   通常のユーザーにはauth.usersへのSELECT権限がない
--   → "permission denied for table users" エラーが発生
--
-- 解決:
--   (SELECT email FROM auth.users WHERE id = auth.uid())
--   を
--   (auth.jwt() ->> 'email')
--   に置き換える
--
-- auth.jwt() はJWTトークンの内容を直接返すため、
-- テーブルへのアクセス権限は不要
-- =====================================================

-- =====================================================
-- 1. group_invitations テーブル
-- =====================================================
DROP POLICY IF EXISTS "gi_select" ON group_invitations;
DROP POLICY IF EXISTS "gi_insert" ON group_invitations;
DROP POLICY IF EXISTS "gi_update" ON group_invitations;

CREATE POLICY "gi_select" ON group_invitations
  FOR SELECT USING (
    invited_by = (SELECT auth.uid())
    OR invited_email = (auth.jwt() ->> 'email')
  );

CREATE POLICY "gi_insert" ON group_invitations
  FOR INSERT WITH CHECK (invited_by = (SELECT auth.uid()));

CREATE POLICY "gi_update" ON group_invitations
  FOR UPDATE USING (
    invited_email = (auth.jwt() ->> 'email')
  );

-- 招待を削除できるポリシーを追加
-- グループのメンバーであれば招待を削除できる（再招待のため）
DROP POLICY IF EXISTS "gi_delete" ON group_invitations;

CREATE POLICY "gi_delete" ON group_invitations
  FOR DELETE USING (
    -- 招待した本人
    invited_by = (SELECT auth.uid())
    -- または、そのグループのメンバー（再招待のために過去の招待を削除する場合）
    OR group_id IN (SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid()))
  );

-- =====================================================
-- 2. split_groups テーブル
--    招待されたユーザーもグループ情報を閲覧可能に
-- =====================================================
DROP POLICY IF EXISTS "sg_select" ON split_groups;

CREATE POLICY "sg_select" ON split_groups
  FOR SELECT USING (
    -- 作成者
    created_by = (SELECT auth.uid())
    -- または、グループメンバー
    OR id IN (SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid()))
    -- または、招待されているユーザー（pending状態の招待がある）
    OR id IN (
      SELECT group_id FROM group_invitations 
      WHERE invited_email = (auth.jwt() ->> 'email')
      AND status = 'pending'
    )
  );

-- =====================================================
-- 変更内容まとめ:
-- 
-- 【変更箇所】
--   auth.users テーブルへのアクセス
--   → auth.jwt() ->> 'email' に変更
--
-- 【対象ポリシー】
--   - gi_select: 招待を閲覧できるユーザー
--   - gi_update: 招待を更新できるユーザー
--   - sg_select: グループを閲覧できるユーザー（招待されている場合も含む）
--
-- 【機能への影響】
--   ✅ 招待機能が正しく動作する
--   ✅ 招待されたユーザーがグループ名を確認できる
--   ✅ "permission denied for table users" エラーが解消
-- =====================================================
