import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users } from "lucide-react";
import { useMe } from "@/queries/auth";
import { useAdminUsers, type AdminListStatus } from "@/queries/users";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { UsersTable } from "@/components/users/UsersTable";
import { Input } from "@/components/ui/input";

/**
 * US-007 — admin-only user management page. Non-admin sessions are
 * redirected to `/` (BE also returns 403 for the underlying endpoints,
 * so this is UI-only noise reduction).
 */
export function AdminUsersPage(): JSX.Element {
  const { data: me, isLoading: meLoading } = useMe();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [role, setRole] = useState<"" | "admin" | "author">("");
  const [status, setStatus] = useState<AdminListStatus>("active");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  const query = useAdminUsers({
    q: debouncedQ || undefined,
    role: role || undefined,
    status,
  });

  if (meLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8" aria-busy>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </main>
    );
  }
  if (me?.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Users className="mr-1.5 inline size-3.5" aria-hidden="true" />
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-foreground">
            Quản lý user
          </h1>
          <p className="mt-1.5 font-body text-sm text-muted-foreground">
            Mời người mới, đổi role, disable, hoặc reset mật khẩu.
          </p>
        </div>
        <InviteUserDialog />
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            aria-label="Tìm user"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "" | "admin" | "author")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter role"
        >
          <option value="">Tất cả role</option>
          <option value="admin">Admin</option>
          <option value="author">Author</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AdminListStatus)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter status"
        >
          <option value="active">Active</option>
          <option value="archived">Disabled</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      )}
      {query.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Không tải được danh sách user. Thử lại sau.
        </div>
      )}
      {query.data && <UsersTable users={query.data} />}
    </main>
  );
}
