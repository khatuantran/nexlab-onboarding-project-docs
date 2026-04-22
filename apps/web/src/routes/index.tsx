import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";

/**
 * Route definitions — kept flat in T4 scaffold. Login + protected
 * routes (RequireAuth wrap) land in T8.
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
];

export const router = createBrowserRouter(routes);
