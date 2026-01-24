-- =====================================================
-- RLSポリシー修正SQL
-- 無限再帰エラーを解決するための修正版
-- =====================================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view groups they are members of" ON split_groups;
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON split_groups;
DROP POLICY IF EXISTS "Users can create groups" ON split_groups;
DROP POLICY IF EXISTS "Owners can update their groups" ON split_groups;
DROP POLICY IF EXISTS "Owners can delete their groups" ON split_groups;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON group_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON group_members;
DROP POLICY IF EXISTS "Owners can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can view their invitations" ON group_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to them or by them" ON group_invitations;
DROP POLICY IF EXISTS "Members can create invitations" ON group_invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON group_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON group_invitations;
DROP POLICY IF EXISTS "Members can view group expenses" ON split_expenses;
DROP POLICY IF EXISTS "Users can view expenses in their groups" ON split_expenses;
DROP POLICY IF EXISTS "Members can create expenses" ON split_expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON split_expenses;
DROP POLICY IF EXISTS "Expense creator can update" ON split_expenses;
DROP POLICY IF EXISTS "Expense creator can delete" ON split_expenses;
DROP POLICY IF EXISTS "Members can view expense participants" ON expense_participants;
DROP POLICY IF EXISTS "Users can view their expense participations" ON expense_participants;
DROP POLICY IF EXISTS "Expense creator can manage participants" ON expense_participants;
DROP POLICY IF EXISTS "Expense creator can update participants" ON expense_participants;
DROP POLICY IF EXISTS "Expense creator can delete participants" ON expense_participants;
DROP POLICY IF EXISTS "Members can view settlements" ON settlements;
DROP POLICY IF EXISTS "Users can view their settlements" ON settlements;
DROP POLICY IF EXISTS "Involved users can create settlements" ON settlements;
DROP POLICY IF EXISTS "Users can create settlements they are involved in" ON settlements;

-- =====================================================
-- 修正版ポリシー（無限再帰を回避）
-- =====================================================

-- split_groups: ユーザーが作成したグループまたはgroup_membersに存在するグループを参照
-- 注意: group_membersを参照せずに、created_byで判定するか、
--       group_membersのポリシーを先にシンプルにする必要がある

-- group_members の修正版ポリシー（自己参照を避ける）
CREATE POLICY "Users can view their own memberships" ON group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own membership" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own membership" ON group_members
  FOR DELETE USING (user_id = auth.uid());

-- split_groups の修正版ポリシー
-- group_membersを参照する代わりに、サブクエリでSECURITY_INVOKERを使用
CREATE POLICY "Users can view groups they created or are members of" ON split_groups
  FOR SELECT USING (
    created_by = auth.uid()
    OR id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- グループ作成ポリシー（これが欠けていた！）
CREATE POLICY "Users can create groups" ON split_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update their groups" ON split_groups
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Owners can delete their groups" ON split_groups
  FOR DELETE USING (created_by = auth.uid());

-- group_invitations の修正版ポリシー
CREATE POLICY "Users can view invitations sent to them or by them" ON group_invitations
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

CREATE POLICY "Users can create invitations" ON group_invitations
  FOR INSERT WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can update their own invitations" ON group_invitations
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- split_expenses の修正版ポリシー
CREATE POLICY "Users can view expenses in their groups" ON split_expenses
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create expenses" ON split_expenses
  FOR INSERT WITH CHECK (paid_by = auth.uid());

CREATE POLICY "Expense creator can update" ON split_expenses
  FOR UPDATE USING (paid_by = auth.uid());

CREATE POLICY "Expense creator can delete" ON split_expenses
  FOR DELETE USING (paid_by = auth.uid());

-- expense_participants の修正版ポリシー
CREATE POLICY "Users can view their expense participations" ON expense_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

CREATE POLICY "Expense creator can manage participants" ON expense_participants
  FOR INSERT WITH CHECK (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

CREATE POLICY "Expense creator can update participants" ON expense_participants
  FOR UPDATE USING (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

CREATE POLICY "Expense creator can delete participants" ON expense_participants
  FOR DELETE USING (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

-- settlements の修正版ポリシー
CREATE POLICY "Users can view their settlements" ON settlements
  FOR SELECT USING (
    from_user = auth.uid() OR to_user = auth.uid()
  );

CREATE POLICY "Users can create settlements they are involved in" ON settlements
  FOR INSERT WITH CHECK (
    from_user = auth.uid() OR to_user = auth.uid()
  );
