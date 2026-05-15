import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { NxLogo } from "@/components/common/NxLogo";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { NavLinks } from "@/components/layout/NavLinks";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { SearchInput } from "@/components/search/SearchInput";
import { useMe } from "@/queries/auth";

/**
 * AppHeader v2 (design-system.md §5.2 + CHANGELOG 2026-05-15).
 *
 * Row 1: NxLogo + NavLinks + SearchInput + NotificationBell + ThemeToggle + UserMenu.
 * Row 2: BreadcrumbBar trail + admin CTA slot (`CreateProjectDialog`).
 *
 * Replaces the v1 inline `displayName + Logout button + Quản lý user`
 * shortcut — all of those collapse into UserMenu dropdown.
 */
export function AppHeader(): JSX.Element | null {
  const { data } = useMe();
  if (!data) return null;
  const isAdmin = data.user.role === "admin";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3 md:gap-4">
        <Link
          to="/"
          aria-label="Về trang chủ Nexlab"
          className="flex-shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <NxLogo size={28} />
        </Link>
        <NavLinks />
        <div className="ml-1 max-w-md flex-1">
          <SearchInput />
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <UserMenu user={data.user} />
        </div>
      </div>
      <div className="border-t border-border/60 bg-muted/30">
        <BreadcrumbBar
          rightSlot={
            isAdmin ? (
              <CreateProjectDialog
                customTrigger={
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 font-ui text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Tạo project
                  </button>
                }
              />
            ) : undefined
          }
        />
      </div>
    </header>
  );
}
