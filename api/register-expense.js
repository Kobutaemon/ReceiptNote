// api/register-expense.js

import { createClient } from "@supabase/supabase-js";

// Vercelに設定した環境変数のキー名
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 【改善点】環境変数が存在するかチェック
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase URLまたはService Keyが環境変数に設定されていません。"
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return response.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return response
        .status(401)
        .json({ error: "Invalid token", details: userError?.message });
    }

    const { expense_date, amount, category, description } = request.body;

    // 金額が数値で、かつ0以上であることを確認
    if (typeof amount !== "number" || amount < 0) {
      return response.status(400).json({ error: "金額が不正です。" });
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("expenses")
      .insert({
        user_id: user.id,
        expense_date,
        amount,
        category,
        description,
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    return response.status(200).json({ message: "登録しました！", data: data });
  } catch (error) {
    // エラーの詳細をログに出力
    console.error("API Route Error:", error);
    return response
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}
