import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <span className="text-sm font-medium">Onboarding Portal</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground" data-testid="current-user">
            {data.user.displayName}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={logout.isPending}>
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
