import { ChevronDown, LogOut, Settings, User, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { AuthUser } from "@onboarding/shared";
import { Avatar } from "@/components/common/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/queries/auth";
import { cn } from "@/lib/cn";

interface UserMenuProps {
  user: AuthUser;
}

/**
 * Header trigger = Avatar (initials) + ChevronDown affordance. Dropdown
 * surface mở ra header (displayName + email + role badge) rồi 4 item:
 *   1. Hồ sơ của tôi  — disabled placeholder (sắp ra mắt)
 *   2. Cài đặt        — disabled placeholder (sắp ra mắt)
 *   3. Quản lý user   — admin-only, route /admin/users
 *   4. Đăng xuất
 *
 * Replaces inline displayName + Logout button + Quản lý user shortcut
 * trên AppHeader v1.
 */
export function UserMenu({ user }: UserMenuProps): JSX.Element {
  const navigate = useNavigate();
  const logout = useLogout();
  const isAdmin = user.role === "admin";

  const handleLogout = (): void => {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/login", { replace: true }),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
        aria-label={`Tài khoản ${user.displayName}`}
        data-testid="current-user"
      >
        <Avatar name={user.displayName} size="sm" />
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar name={user.displayName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-ui text-sm font-semibold text-foreground">
              {user.displayName}
            </p>
            <p className="truncate font-ui text-xs text-muted-foreground">{user.email}</p>
            <span
              className={cn(
                "mt-1 inline-flex items-center rounded-full px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide",
                isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {isAdmin ? "Admin" : "Author"}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled title="Sắp ra mắt">
          <User className="size-4" aria-hidden="true" />
          Hồ sơ của tôi
          <span className="ml-auto font-ui text-[10px] uppercase tracking-wide text-muted-foreground">
            Sắp ra mắt
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Sắp ra mắt">
          <Settings className="size-4" aria-hidden="true" />
          Cài đặt
          <span className="ml-auto font-ui text-[10px] uppercase tracking-wide text-muted-foreground">
            Sắp ra mắt
          </span>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin/users">
              <Users className="size-4" aria-hidden="true" />
              Quản lý user
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          disabled={logout.isPending}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
