import type { AdminUser } from "@onboarding/shared";
import { formatRelativeVi } from "@/lib/relativeTime";
import { Avatar } from "@/components/common/Avatar";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserActionsMenu } from "./UserActionsMenu";

interface UsersTableProps {
  users: AdminUser[];
}

const ROLE_BADGE: Record<AdminUser["role"], string> = {
  admin: "bg-primary/15 text-primary",
  author: "bg-muted text-muted-foreground",
};

export function UsersTable({ users }: UsersTableProps): JSX.Element {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <p className="font-body text-sm text-muted-foreground">
          Không có user nào khớp bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr className="text-left font-ui text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2.5">Người dùng</th>
            <th className="px-4 py-2.5">Role</th>
            <th className="px-4 py-2.5">Trạng thái</th>
            <th className="px-4 py-2.5">Lần login cuối</th>
            <th className="w-12 px-4 py-2.5" aria-label="Thao tác" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/20"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={u.displayName} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-ui text-sm font-semibold text-foreground">
                      {u.displayName}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-ui text-[11px] font-bold uppercase tracking-wide ${ROLE_BADGE[u.role]}`}
                >
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <UserStatusBadge archivedAt={u.archivedAt} />
              </td>
              <td className="px-4 py-3 font-ui text-xs text-muted-foreground">
                {u.lastLoginAt ? formatRelativeVi(u.lastLoginAt) : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <UserActionsMenu user={u} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
