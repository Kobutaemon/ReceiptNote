-- =====================================================
-- group_members にemailカラムを追加
-- これによりメールアドレスを直接保存して表示できるようにする
-- =====================================================

-- emailカラムを追加
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS email TEXT;

-- 既存データの更新（手動で行う必要がある場合があります）
-- UPDATE group_members SET email = '...' WHERE user_id = '...';
