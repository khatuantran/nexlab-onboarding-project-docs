import { LogOut, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdminGate } from "@/components/common/AdminGate";
import { NxLogo } from "@/components/common/NxLogo";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SearchInput } from "@/components/search/SearchInput";
import { useLogout, useMe } from "@/queries/auth";

export function AppHeader(): JSX.Element | null {
  const { data } = useMe();
  const navigate = useNavigate();
  const logout = useLogout();

  if (!data) return null;

  const handleLogout = (): void => {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/login", { replace: true }),
    });
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
        <Link
          to="/"
          aria-label="Về trang chủ Nexlab"
          className="flex-shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <NxLogo size={28} />
        </Link>
        <div className="flex-1">
          <SearchInput />
        </div>
        <div className="flex items-center gap-3 font-ui text-sm">
          <AdminGate>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-ui text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Users className="size-4" aria-hidden="true" />
              Quản lý user
            </Link>
            <CreateProjectDialog />
          </AdminGate>
          <span className="text-muted-foreground" data-testid="current-user">
            {data.user.displayName}
          </span>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={logout.isPending}>
            <LogOut className="mr-2 size-4" aria-hidden="true" />
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
