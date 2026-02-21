-- =====================================================
-- split_expenses / expense_participants の INSERT ポリシー修正
-- 
-- 問題: 
--   現在の se_insert ポリシーは paid_by = auth.uid() のみを許可。
--   つまり「自分が支払者の場合」しか支出を登録できない。
--   他のメンバーが支払った支出を登録しようとするとRLSで拒否される。
--
--   ep_insert も同様に、paid_by = auth.uid() の支出にしか
--   参加者を追加できないため、他メンバーの支出に対して
--   参加者が追加できない。
--
-- 解決:
--   グループメンバーであれば誰でも支出と参加者を登録できるようにする。
--   （settlementsの018マイグレーションと同じ方針）
--
-- 影響範囲:
--   - split_expenses: se_insert ポリシーのみ変更
--   - expense_participants: ep_insert ポリシーのみ変更
--   - 他のポリシー (SELECT, UPDATE, DELETE) は変更なし
-- =====================================================

-- =====================================================
-- 1. split_expenses の INSERT ポリシー修正
-- =====================================================
DROP POLICY IF EXISTS "se_insert" ON split_expenses;

-- グループメンバーであれば支出を登録可能
CREATE POLICY "se_insert" ON split_expenses
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- 2. expense_participants の INSERT ポリシー修正
-- =====================================================
DROP POLICY IF EXISTS "ep_insert" ON expense_participants;

-- expense_id の支出が属するグループのメンバーであれば参加者を追加可能
CREATE POLICY "ep_insert" ON expense_participants
  FOR INSERT WITH CHECK (
    expense_id IN (
      SELECT id FROM split_expenses
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid())
      )
    )
  );

-- =====================================================
-- 変更内容まとめ:
-- 
-- 【変更箇所】
--   1. se_insert (split_expenses INSERT)
--      変更前: paid_by = auth.uid()  ← 自分が支払者の場合のみ
--      変更後: group_id IN (SELECT ...)  ← グループメンバーなら誰でも
--
--   2. ep_insert (expense_participants INSERT)
--      変更前: expense_id IN (SELECT id FROM split_expenses WHERE paid_by = auth.uid())
--              ← 自分が支払者の支出にのみ参加者追加可
--      変更後: expense_id IN (SELECT id FROM split_expenses WHERE group_id IN (...))
--              ← グループメンバーなら誰でも参加者追加可
--
-- 【変更しないポリシー】
--   - se_select: そのまま（グループメンバーなら閲覧可 → 問題なし）
--   - se_update: そのまま（支払者のみ更新可 → 問題なし）
--   - se_delete: そのまま（支払者のみ削除可 → 問題なし）
--   - ep_select: そのまま
--   - ep_update: そのまま
--   - ep_delete: そのまま
--
-- 【機能への影響】
--   ✅ グループメンバーなら誰でも支出を登録できる
--   ✅ 支払者を他のメンバーに設定しても登録できる
--   ✅ 支出の更新・削除は引き続き支払者本人のみ
--   ✅ ユーザー名表示等の既存機能に影響なし
-- =====================================================
