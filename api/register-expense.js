/* eslint-env node */
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
  // CORSヘッダーを設定
  response.setHeader(
    "Access-Control-Allow-Origin",
    "https://receipt-note.vercel.app/"
  );
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // OPTIONSリクエストの処理（プリフライトリクエスト）
  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

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

    // リクエストボディの検証
    if (!request.body) {
      return response.status(400).json({ error: "リクエストボディが空です。" });
    }

    const { expense_date, price, category, description } = request.body;

    // 必須フィールドの検証
    if (!expense_date || price === undefined || price === null || !category) {
      return response.status(400).json({
        error: "必須フィールドが不足しています。(日付、金額、カテゴリ)",
      });
    }

    // 金額が数値で、かつ0以上であることを確認
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numericPrice) || numericPrice < 0) {
      return response.status(400).json({ error: "金額が不正です。" });
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("expenses")
      .insert({
        user_id: user.id,
        expense_date,
        price: numericPrice,
        category,
        description: description || null,
      })
      .select();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return response.status(500).json({
        error: "データベースへの保存に失敗しました。",
        details: insertError.message,
      });
    }

    return response.status(200).json({
      message: "登録しました！",
      data: data,
    });
  } catch (error) {
    // エラーの詳細をログに出力
    console.error("API Route Error:", error);

    // レスポンスがまだ送信されていない場合のみエラーレスポンスを送信
    if (!response.headersSent) {
      return response.status(500).json({
        error: "内部サーバーエラーが発生しました。",
        details: error.message,
      });
    }
  }
}
