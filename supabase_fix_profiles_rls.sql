-- profiles テーブルのRLSポリシー修正
-- グループメンバー同士であればプロフィール（display_name）を閲覧できるようにする

-- 既存の「自分のプロフィールのみ閲覧可能」ポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 新しいポリシー: 自分のプロフィールまたは同じグループのメンバーのプロフィールを閲覧可能
CREATE POLICY "Users can view profiles of group members" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR
    id IN (
      SELECT gm.user_id 
      FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );
