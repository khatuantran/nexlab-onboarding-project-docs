import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "@/queries/auth";

/**
 * Gate any subtree behind an authenticated session. While the initial
 * `useMe` query is in-flight, render a minimal placeholder (not blank,
 * so keyboard focus doesn't jump). 401 → redirect `/login?next=<path>`.
 */
export function RequireAuth({ children }: { children: ReactNode }): JSX.Element {
  const { data, isPending } = useMe();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="p-6 text-sm text-muted-foreground" aria-live="polite">
        Đang tải…
      </div>
    );
  }

  if (!data) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}
