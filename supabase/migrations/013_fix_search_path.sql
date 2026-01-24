-- =====================================================
-- Security Issue Fix: Function Search Path Mutable
-- 
-- 対象関数:
--   1. public.get_user_group_ids
--   2. public.handle_new_user
--
-- 問題: search_path パラメータが設定されていない
-- 解決: search_path = '' を設定し、完全修飾名でオブジェクトを参照
-- =====================================================

-- =====================================================
-- 1. get_user_group_ids 関数の修正
-- 用途: ユーザーが所属するグループIDを取得（RLSポリシーで使用）
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
$$;

-- =====================================================
-- 2. handle_new_user 関数の修正
-- 用途: 新規ユーザー登録時にprofilesテーブルにレコードを自動作成
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =====================================================
-- 変更内容の説明:
-- 
-- 【追加した設定】
--   SET search_path = ''
--   
-- 【変更したオブジェクト参照】
--   - group_members → public.group_members
--   - profiles → public.profiles
--
-- 【機能への影響】
--   なし。関数の動作ロジックは完全に同一です。
--   セキュリティが強化されただけで、既存の機能は変わりません。
--
-- 【なぜこの修正が必要か】
--   search_path が未設定の場合、PostgreSQLはデフォルトの検索パスを
--   使用します。悪意のあるユーザーが自分のスキーマに同名のテーブルや
--   関数を作成し、SECURITY DEFINER関数の動作を乗っ取る可能性があります。
--   
--   search_path = '' を設定することで:
--   1. すべてのオブジェクト参照で明示的なスキーマ指定が必要
--   2. 意図しないスキーマからのオブジェクト参照を防止
--   3. SECURITY DEFINER関数の安全性が向上
-- =====================================================
