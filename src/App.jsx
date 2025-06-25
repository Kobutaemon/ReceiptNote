import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// 以下Supabaseのためのimport
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient.js";
import { Auth } from "@supabase/auth-ui-react";
// import { ja } from "@supabase/auth-ui-react/dist/locales/ja";
import { ThemeSupa, ja } from "@supabase/auth-ui-shared";
import Register from "./components/Register.jsx";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
              variables: {
                ...ja,
              },
            }}
          />
        </div>
      </div>
    );
  } else {
    return (
      <BrowserRouter>
        <Sidebar />
        <div className="bg-gray-100 h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/bicycle"
              element={
                <Register
                  btnColor="blue"
                  category="駐輪代"
                  user={session.user}
                />
              }
            />
            <Route
              path="/shopping"
              element={
                <Register
                  btnColor="green"
                  category="買い物代"
                  user={session.user}
                />
              }
            />
            <Route
              path="/something"
              element={
                <Register
                  btnColor="gray"
                  category="その他"
                  user={session.user}
                />
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
