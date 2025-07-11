# ReceiptNote

ReceiptNote は、支出を効率的に管理するための Web アプリケーションです。直感的なユーザーインターフェースで、家計管理を簡単に行うことができます。

## 🚀 デモ

[**ライブデモを見る**](https://receipt-note.vercel.app/)

## 特徴

- 📱 **レスポンシブデザイン**: モバイルからデスクトップまで、どのデバイスでも快適に使用可能
- 🔐 **安全な認証**: Supabase による安全なユーザー認証システム
- 📊 **カテゴリ管理**: 支出を駐輪代、買い物代、その他などのカテゴリで分類
- 🎨 **モダン UI**: TailwindCSS による美しく現代的なユーザーインターフェース
- 🚀 **すぐに利用可能**: Vercel にデプロイ済み、ユーザー登録のみで利用開始

## 使い方

1. **アプリにアクセス**: 上記のリンクからアプリにアクセス
2. **ユーザー登録**: メールアドレスとパスワードでアカウントを作成
3. **ログイン**: 作成したアカウントでログイン
4. **支出を管理**: カテゴリ別に支出を記録・管理

## 開発者向け情報

### 技術スタック

- **Frontend**: React 19, React Router DOM
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (認証・データベース)
- **Icons**: Lucide React
- **Linting**: ESLint
- **Deployment**: Vercel

#### 前提条件

- Node.js (18.0 以上)
- npm または yarn
- Supabase アカウント

#### プロジェクト構造

```
src/
├── components/         # 再利用可能なコンポーネント
│   ├── Card.jsx
│   ├── CardList.jsx
│   └── Sidebar.jsx
├── pages/             # ページコンポーネント
│   ├── Dashboard.jsx
│   └── Register.jsx
├── lib/               # ライブラリ・ユーティリティ
│   └── supabaseClient.js
├── utils/             # ヘルパー関数
│   ├── colorMap.js
│   ├── dateUtils.js
│   └── toTwoDigits.js
└── assets/            # 静的アセット
    ├── notebook.svg
    └── react.svg
```

## 機能

### 認証

- Supabase によるユーザー登録・ログイン
- セッション管理

### ダッシュボード

- カテゴリ別の支出表示
- カード形式での直感的な UI
- レスポンシブデザイン

## ライセンス

© 2025 Kobutaemon All Rights Reserved.
