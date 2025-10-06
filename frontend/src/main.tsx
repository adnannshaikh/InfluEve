// src/main.tsx
import React from "react";
import './index.css'
import type { ReactElement } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from "react-router-dom";
import App from "./App";
import BriefPage from "./pages/BriefPage";
import AddInfluencersPage from "./pages/AddInfluencersPage";
import ReportsPage from "./pages/ReportsPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Inline auth guard (keeps everything self-contained)
function RequireAuth({ children }: { children: ReactElement }) {
  const token = localStorage.getItem("token");
  const loc = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Protected pages
      { index: true, element: <RequireAuth><BriefPage /></RequireAuth> },
      { path: "add", element: <RequireAuth><AddInfluencersPage /></RequireAuth> },
      { path: "reports/:briefId", element: <RequireAuth><ReportsPage /></RequireAuth> },

      // Public auth pages
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
