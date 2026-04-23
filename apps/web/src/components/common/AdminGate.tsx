import { type ReactNode } from "react";
import { useMe } from "@/queries/auth";

/**
 * Renders children only when the current session has role `admin`.
 * Invisible otherwise (no placeholder, no error). Server-side 403 still
 * protects the underlying endpoints — this is UI noise reduction, not
 * a security boundary.
 */
export function AdminGate({ children }: { children: ReactNode }): JSX.Element | null {
  const { data } = useMe();
  if (data?.user.role !== "admin") return null;
  return <>{children}</>;
}
