import { createBrowserRouter, Outlet, type RouteObject } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { AppHeader } from "@/components/layout/AppHeader";
import { RequireAuth } from "@/components/layout/RequireAuth";

function ProtectedLayout(): JSX.Element {
  return (
    <RequireAuth>
      <AppHeader />
      <Outlet />
    </RequireAuth>
  );
}

export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedLayout />,
    children: [{ path: "/", element: <HomePage /> }],
  },
];

export const router = createBrowserRouter(routes);
