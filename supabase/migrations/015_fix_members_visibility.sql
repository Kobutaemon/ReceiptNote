-- =====================================================
-- RLSポリシー 機能修正SQL
-- 
-- 問題: group_membersのSELECTポリシーが厳しすぎて
--       同じグループのメンバーが見えなくなっている
-- 
-- 解決: SECURITY DEFINER関数を使用して無限再帰を回避しつつ
--       同じグループのメンバーを閲覧できるようにする
-- =====================================================

-- =====================================================
-- Step 1: ヘルパー関数の再作成（search_path設定 + パフォーマンス最適化）
-- =====================================================

-- ユーザーが所属するグループIDを返す関数
-- SECURITY DEFINER により RLS をバイパスして実行
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
-- Step 2: group_members テーブルのポリシー修正
-- 同じグループのメンバーも閲覧できるようにする
-- =====================================================
DROP POLICY IF EXISTS "gm_select" ON group_members;

-- 同じグループに所属するメンバーのレコードを閲覧可能
CREATE POLICY "gm_select" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT public.get_user_group_ids())
  );

-- =====================================================
-- Step 3: profiles テーブルのポリシー確認・修正
-- グループメンバーのプロフィールを閲覧できるようにする
-- =====================================================
DROP POLICY IF EXISTS "Users can view profiles of group members" ON profiles;

CREATE POLICY "Users can view profiles of group members" ON profiles
  FOR SELECT USING (
    (SELECT auth.uid()) = id
    OR
    id IN (
      SELECT gm.user_id 
      FROM public.group_members gm
      WHERE gm.group_id IN (SELECT public.get_user_group_ids())
    )
  );

-- =====================================================
-- 変更内容:
-- 
-- 1. get_user_group_ids() 関数
--    - search_path = '' を設定（セキュリティ修正）
--    - public.group_members で完全修飾名を使用
--
-- 2. gm_select ポリシー
--    - 変更前: user_id = (SELECT auth.uid()) ← 自分だけ
--    - 変更後: group_id IN (SELECT get_user_group_ids()) ← 同じグループ全員
--
-- 3. profiles の閲覧ポリシー
--    - group_membersを参照してグループメンバーのプロフィールを取得
--
-- 機能への影響:
--    ✅ グループメンバー一覧が正しく表示される
--    ✅ メンバーのdisplay_nameが表示される
--    ✅ 割り勘の人数が正しく表示される
-- =====================================================
