import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Wallet, Users } from "lucide-react";
import UserMenu from "./UserMenu";

function Layout({ user, onLogout }) {
  const location = useLocation();

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="flex items-center justify-between px-4 pt-4">
        {/* 左側: スペーサー */}
        <div className="w-10" />

        {/* 中央: タイトル */}
        <h1 className="text-3xl font-bold">ReceiptNote</h1>

        {/* 右側: ユーザーメニュー */}
        <div className="w-10">
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="flex justify-center mt-6">
        <div className="inline-flex rounded-lg bg-gray-200 p-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`
            }
            end
          >
            <Wallet size={18} />
            <span>支出管理</span>
          </NavLink>
          <NavLink
            to="/split"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive || location.pathname.startsWith("/split")
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`
            }
          >
            <Users size={18} />
            <span>割り勘</span>
          </NavLink>
        </div>
      </div>

      <main>
        <Outlet />
      </main>

      <footer>
        <p className="text-center mt-10 pb-6">
          &copy; 2025 Kobutaemon All Right Reserved.
        </p>
      </footer>
    </div>
  );
}

export default Layout;

