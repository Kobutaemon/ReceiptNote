import Dashboard from "./pages/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ja } from "./lib/ja.js";
import { useAuth } from "./lib/authContext.js";

function App() {
  const { session, status } = useAuth();

  const handleLogout = async () => {
    const shouldSignOut = window.confirm("ログアウトしますか？");
    if (!shouldSignOut) {
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      alert("ログアウト中にエラーが発生しました: " + error.message);
    }
  };

  if (status === "checking") {
    return (
      <div
        className="flex h-screen items-center justify-center bg-gray-100 text-gray-600"
        aria-live="polite"
        aria-busy="true"
      >
        セッションを確認しています...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-full max-w-md p-8">
          <Auth
            supabaseClient={supabase}
            // appearanceプロパティでテーマを適用します
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="dark"
            localization={{
              variables: ja,
            }}
          />
        </div>
      </div>
    );
  } else {
    const isBrowser = typeof window !== "undefined";
    const isRootPath = !isBrowser || window.location.pathname === "/";

    if (!isRootPath) {
      return (
        <NotFound
          onGoHome={() => {
            window.location.href = "/";
          }}
        />
      );
    }

    return (
      <div className="bg-gray-100 min-h-screen">
        <Dashboard user={session.user} onLogout={handleLogout} />
      </div>
    );
  }
}

export default App;
