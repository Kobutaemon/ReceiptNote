import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import NotFound from "./pages/NotFound.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ja } from "./lib/ja.js";
import { useAuth } from "./lib/authContext.js";
import ToastProvider from "./lib/ToastProvider.jsx";
import { useToast } from "./lib/toastContext.js";
import { createRouter } from "./router.jsx";

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

  const router = useMemo(() => {
    if (!session) return null;
    return createRouter(session.user, handleLogout);
  }, [session, handleLogout]);

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
  }

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
