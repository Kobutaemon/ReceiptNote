// api/register-expense.js

import { createClient } from "@supabase/supabase-js";

// サーバーサイドでのみ動作するため、ここに直接キーを書くのではなく、
// Vercelの環境変数から読み込むのがベストプラクティス。
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // service_roleキー

// service_roleキーを使って、管理者権限を持つSupabaseクライアントを作成
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(request, response) {
  // POSTリクエスト以外は拒否
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1. リクエストからJWT（認証トークン）を取得
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return response.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];

    // 2. トークンを検証してユーザー情報を取得
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError) {
      return response
        .status(401)
        .json({ error: "Invalid token", details: userError.message });
    }

    // 3. リクエストボディから経費データを取得
    const { expense_date, amount, category, description } = request.body;

    // 4. 取得したユーザーIDを使ってデータを登録
    const { data, error: insertError } = await supabaseAdmin
      .from("expenses")
      .insert({
        user_id: user.id, // 検証済みのユーザーIDを使用
        expense_date,
        amount,
        category,
        description,
      })
      .select(); // .select() を付けると登録後のデータを返してくれる

    if (insertError) {
      throw insertError;
    }

    // 5. 成功レスポンスを返す
    return response.status(200).json({ message: "登録しました！", data: data });
  } catch (error) {
    return response
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}
