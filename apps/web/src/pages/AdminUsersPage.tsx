import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Check, Search, Star, User as UserIcon, Users } from "lucide-react";
import { useMe } from "@/queries/auth";
import { useAdminUsers, type AdminListStatus } from "@/queries/users";
import { GradientHero } from "@/components/patterns/GradientHero";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { UsersTable } from "@/components/users/UsersTable";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

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

  const total = query.data?.length ?? 0;
  const active = query.data?.filter((u) => !u.archivedAt).length ?? 0;
  const admins = query.data?.filter((u) => u.role === "admin").length ?? 0;

  return (
    <main className="bg-background pb-16">
      {/* Dark vivid hero */}
      <GradientHero
        showWatermark
        gridOverlay
        className="px-10 pb-14 pt-10"
        blobs={[
          { color: "rgba(244,63,94,0.4)", size: 320, pos: { top: -60, left: -40 } },
          { color: "rgba(139,92,246,0.35)", size: 260, pos: { top: -30, right: 180 } },
          { color: "rgba(59,130,246,0.3)", size: 280, pos: { bottom: -30, right: -10 } },
        ]}
      >
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end">
          <div className="flex-1">
            <span className="mb-3.5 inline-flex items-center rounded-full border border-rose-500/55 bg-rose-500/35 px-3.5 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-rose-100">
              ✦ Quản trị hệ thống
            </span>
            <h1 className="font-display text-[44px] font-black leading-[48px] tracking-[-0.03em] text-white sm:text-[52px] sm:leading-[56px]">
              Quản lý
              <br />
              <span className="bg-gradient-to-r from-rose-500 to-rose-300 bg-clip-text text-transparent">
                người dùng
              </span>
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <UserStat
              icon={Users}
              gradient="from-rose-700 to-rose-500"
              value={total}
              label="Tổng users"
            />
            <UserStat
              icon={Check}
              gradient="from-green-700 to-green-500"
              value={active}
              label="Đang hoạt động"
            />
            <UserStat
              icon={UserIcon}
              gradient="from-blue-700 to-blue-500"
              value={total - admins}
              label="Authors"
            />
            <UserStat
              icon={Star}
              gradient="from-purple-700 to-purple-500"
              value={admins}
              label="Admin"
            />
          </div>
        </div>
      </GradientHero>

      {/* Floating toolbar */}
      <div className="relative -mt-[22px] px-10">
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-border bg-background p-2.5 px-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
          <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            aria-label="Tìm user"
            className="min-w-[200px] flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <span aria-hidden="true" className="hidden h-[22px] w-px bg-border sm:block" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "" | "admin" | "author")}
            className="h-8 rounded-md border border-input bg-background px-2.5 font-ui text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter role"
          >
            <option value="">Tất cả role</option>
            <option value="admin">Admin</option>
            <option value="author">Author</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminListStatus)}
            className="h-8 rounded-md border border-input bg-background px-2.5 font-ui text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter status"
          >
            <option value="active">Active</option>
            <option value="archived">Disabled</option>
            <option value="all">Tất cả</option>
          </select>
          <span aria-hidden="true" className="hidden h-[22px] w-px bg-border sm:block" />
          <InviteUserDialog />
        </div>
      </div>

      <div className="px-10 pt-5">
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
      </div>
    </main>
  );
}

interface UserStatProps {
  icon: typeof Users;
  gradient: string;
  value: number | string;
  label: string;
}

function UserStat({ icon: Icon, gradient, value, label }: UserStatProps): JSX.Element {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.06] p-[16px_12px] text-center backdrop-blur-md">
      <span
        aria-hidden="true"
        className={cn(
          "mb-2 inline-flex size-10 items-center justify-center rounded-[12px] bg-gradient-to-br shadow-[0_4px_14px_rgba(0,0,0,0.35)]",
          gradient,
        )}
      >
        <Icon className="size-[18px] text-white" />
      </span>
      <div className="font-display text-[24px] font-black tracking-[-0.02em] text-white">
        {value}
      </div>
      <div className="mt-1.5 font-ui text-[11px]/[1.3] font-semibold text-white/75">{label}</div>
    </div>
  );
}
