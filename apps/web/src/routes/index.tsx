import { createBrowserRouter, Outlet, type RouteObject } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { ProjectLandingPage } from "@/pages/ProjectLandingPage";
import { FeatureDetailPage } from "@/pages/FeatureDetailPage";
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
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/projects/:slug", element: <ProjectLandingPage /> },
      { path: "/projects/:slug/features/:featureSlug", element: <FeatureDetailPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
