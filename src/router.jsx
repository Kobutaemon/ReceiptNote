import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import SplitListPage from "./pages/SplitListPage";
import SplitDetailPage from "./pages/SplitDetailPage";
import NotFound from "./pages/NotFound";

export function createRouter(user, onLogout) {
  return createBrowserRouter([
    {
      path: "/",
      element: <Layout user={user} onLogout={onLogout} />,
      children: [
        {
          index: true,
          element: <Dashboard user={user} />,
        },
        {
          path: "split",
          element: <SplitListPage user={user} />,
        },
        {
          path: "split/:groupId",
          element: <SplitDetailPage user={user} />,
        },
      ],
    },
    {
      path: "*",
      element: (
        <NotFound
          onGoHome={() => {
            window.location.href = "/";
          }}
        />
      ),
    },
  ]);
}
