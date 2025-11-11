import { createClient } from "@supabase/supabase-js";

// 環境変数からURLとキーを取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabaseクライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "receiptnote.auth.session",
  },
});
