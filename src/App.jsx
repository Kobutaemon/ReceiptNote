import Dashboard from "./pages/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ja } from "./lib/ja.js";
import { useAuth } from "./lib/authContext.js";
import ToastProvider from "./lib/ToastProvider.jsx";
import { useToast } from "./lib/toastContext.js";

function AppContent() {
  const { session, status } = useAuth();
  const { showToast } = useToast();

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
      showToast("ログアウト中にエラーが発生しました: " + error.message, "error");
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

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
