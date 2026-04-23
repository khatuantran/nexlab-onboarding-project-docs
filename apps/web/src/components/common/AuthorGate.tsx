import { type ReactNode } from "react";
import { useMe } from "@/queries/auth";

/**
 * Renders children iff the current session has role `admin` or `author`.
 * Server-side 403 still protects underlying endpoints — this hides
 * action affordances for viewer-only sessions (none in v1, but future-
 * proofed for read-only invites).
 */
export function AuthorGate({ children }: { children: ReactNode }): JSX.Element | null {
  const { data } = useMe();
  const role = data?.user.role;
  if (role !== "admin" && role !== "author") return null;
  return <>{children}</>;
}
