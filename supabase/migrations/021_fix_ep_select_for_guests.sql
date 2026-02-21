-- =====================================================
-- expense_participants の SELECT ポリシー修正
-- 
-- 問題:
--   現在の ep_select ポリシーは以下の条件:
--     user_id = auth.uid()
--     OR expense_id IN (SELECT ... WHERE paid_by = auth.uid())
--   
--   これだとゲスト参加者（user_id = NULL）の行は
--   支払者以外のユーザーからは見えない。
--   → ゲスト名が表示されない
--   → ゲストの分担額が見えない
--   → 参加者数が少なく見え、残高計算が狂い「精算済み」と誤判定
--
-- 解決:
--   settlementsや split_expenses と同じ方針で、
--   グループメンバーであれば全参加者行を閲覧可能にする。
--   expense_id → split_expenses.group_id → group_members で
--   アクセス権を判定する。
--
-- 影響範囲:
--   - expense_participants: ep_select ポリシーのみ変更
--   - 他のポリシー (INSERT, UPDATE, DELETE) は変更なし
-- =====================================================

DROP POLICY IF EXISTS "ep_select" ON expense_participants;

-- グループメンバーであれば、そのグループの支出の全参加者を閲覧可能
CREATE POLICY "ep_select" ON expense_participants
  FOR SELECT USING (
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
--   ep_select (expense_participants SELECT)
--   変更前: user_id = auth.uid() 
--           OR expense_id IN (...paid_by = auth.uid())
--           → 自分のデータか、自分が支払った支出の参加者のみ
--   変更後: expense_id IN (...group_id IN (...group_members))
--           → グループメンバーなら全参加者を閲覧可能
--
-- 【なぜこの修正が必要か】
--   ゲスト参加者は user_id = NULL のため、旧ポリシーでは
--   支払者以外のメンバーからは一切見えなかった。
--   これにより以下のバグが発生:
--     1. ゲスト名が表示されない
--     2. ゲストの負担額が見えない
--     3. 参加者数が実際より少なくなり、残高計算が狂う
--        → 精算済みと誤表示される
--
-- 【セキュリティ】
--   split_expenses は既にグループメンバーのみ閲覧可能（se_select）。
--   expense_participants もそれに合わせるだけなので、
--   セキュリティレベルは適切に維持される。
-- =====================================================
