-- =====================================================
-- settlements に支出（split_expenses）紐づけ用の列を追加
-- 目的: 「各支払いごとに精算」および「複数支払いのまとめ精算」を記録・判定可能にする
-- =====================================================

ALTER TABLE settlements
  ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES split_expenses(id) ON DELETE SET NULL;

-- 参照しやすいようにインデックス追加
CREATE INDEX IF NOT EXISTS idx_settlements_expense_id ON settlements(expense_id);

