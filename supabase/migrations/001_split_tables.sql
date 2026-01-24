-- =====================================================
-- Splitwise風割り勘機能用テーブル作成SQL
-- Supabaseダッシュボードの SQL Editor で実行してください
-- =====================================================

-- 1. グループテーブル
CREATE TABLE split_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. グループメンバーテーブル
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES split_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  UNIQUE(group_id, user_id)
);

-- 3. 招待テーブル
CREATE TABLE group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES split_groups(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, invited_email)
);

-- 4. 割り勘支出テーブル
CREATE TABLE split_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES split_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 支出参加者テーブル
CREATE TABLE expense_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES split_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_amount NUMERIC NOT NULL CHECK (share_amount >= 0),
  is_settled BOOLEAN DEFAULT FALSE,
  UNIQUE(expense_id, user_id)
);

-- 6. 精算記録テーブル
CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES split_groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) ポリシー
-- =====================================================

-- split_groups の RLS
ALTER TABLE split_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they are members of" ON split_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create groups" ON split_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update their groups" ON split_groups
  FOR UPDATE USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Owners can delete their groups" ON split_groups
  FOR DELETE USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- group_members の RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members gm WHERE gm.user_id = auth.uid())
  );

CREATE POLICY "Owners can manage members" ON group_members
  FOR ALL USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'owner')
    OR user_id = auth.uid()
  );

-- group_invitations の RLS
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invitations" ON group_invitations
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
    OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can create invitations" ON group_invitations
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own invitations" ON group_invitations
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- split_expenses の RLS
ALTER TABLE split_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group expenses" ON split_expenses
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can create expenses" ON split_expenses
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    AND paid_by = auth.uid()
  );

CREATE POLICY "Expense creator can update" ON split_expenses
  FOR UPDATE USING (paid_by = auth.uid());

CREATE POLICY "Expense creator can delete" ON split_expenses
  FOR DELETE USING (paid_by = auth.uid());

-- expense_participants の RLS
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view expense participants" ON expense_participants
  FOR SELECT USING (
    expense_id IN (
      SELECT id FROM split_expenses WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Expense creator can manage participants" ON expense_participants
  FOR ALL USING (
    expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
  );

-- settlements の RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view settlements" ON settlements
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Involved users can create settlements" ON settlements
  FOR INSERT WITH CHECK (
    from_user = auth.uid() OR to_user = auth.uid()
  );

-- =====================================================
-- インデックス（パフォーマンス向上用）
-- =====================================================

CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_invitations_email ON group_invitations(invited_email);
CREATE INDEX idx_split_expenses_group_id ON split_expenses(group_id);
CREATE INDEX idx_expense_participants_expense_id ON expense_participants(expense_id);
CREATE INDEX idx_settlements_group_id ON settlements(group_id);
