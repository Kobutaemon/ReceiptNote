-- =====================================================
-- RLSポリシー完全修正SQL
-- すべての無限再帰を回避するシンプルな設計
-- =====================================================

-- すべての既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view groups they are members of" ON split_groups;
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON split_groups;
DROP POLICY IF EXISTS "Users can view groups they created or are members of or invited to" ON split_groups;
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
DROP POLICY IF EXISTS "Users can view invitations" ON group_invitations;
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
-- シンプルな新ポリシー（相互参照を避ける）
-- =====================================================

-- ===== group_members =====
-- 一番基本のテーブル。他のテーブルを参照しない
CREATE POLICY "gm_select" ON group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "gm_insert" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "gm_delete" ON group_members
  FOR DELETE USING (user_id = auth.uid());

-- ===== split_groups =====
-- group_membersのみを参照（group_invitationsは参照しない）
CREATE POLICY "sg_select" ON split_groups
  FOR SELECT USING (
    created_by = auth.uid()
    OR id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "sg_insert" ON split_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "sg_update" ON split_groups
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "sg_delete" ON split_groups
  FOR DELETE USING (created_by = auth.uid());

-- ===== group_invitations =====
-- 招待者または招待された人のみが見える（他テーブル参照を最小化）
CREATE POLICY "gi_select" ON group_invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "gi_insert" ON group_invitations
  FOR INSERT WITH CHECK (invited_by = auth.uid());

CREATE POLICY "gi_update" ON group_invitations
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ===== split_expenses =====
CREATE POLICY "se_select" ON split_expenses
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "se_insert" ON split_expenses
  FOR INSERT WITH CHECK (paid_by = auth.uid());

CREATE POLICY "se_update" ON split_expenses
  FOR UPDATE USING (paid_by = auth.uid());

CREATE POLICY "se_delete" ON split_expenses
  FOR DELETE USING (paid_by = auth.uid());

-- ===== expense_participants =====
CREATE POLICY "ep_select" ON expense_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

CREATE POLICY "ep_insert" ON expense_participants
  FOR INSERT WITH CHECK (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

CREATE POLICY "ep_update" ON expense_participants
  FOR UPDATE USING (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

CREATE POLICY "ep_delete" ON expense_participants
  FOR DELETE USING (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

-- ===== settlements =====
CREATE POLICY "st_select" ON settlements
  FOR SELECT USING (
    from_user = auth.uid() OR to_user = auth.uid()
  );

CREATE POLICY "st_insert" ON settlements
  FOR INSERT WITH CHECK (
    from_user = auth.uid() OR to_user = auth.uid()
  );
