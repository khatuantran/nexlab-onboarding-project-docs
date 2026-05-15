import { Link } from "react-router-dom";
import { NxLogo } from "@/components/common/NxLogo";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { SearchInput } from "@/components/search/SearchInput";
import { useMe } from "@/queries/auth";

/**
 * AppHeader v3 (CR-006 — single-row chrome).
 *
 * Replaces v2 2-row layout. Row 2 (BreadcrumbBar + admin CTA) collapses
 * — breadcrumb merges inline into the left cluster; admin CTA moves to
 * per-page section headers (e.g. HomePage "+ Tạo dự án mới").
 *
 * Layout: Logo + inline breadcrumb left · SearchInput center-flex ·
 * Bell + ThemeToggle + UserMenu right. h-14 sticky warm canvas chrome.
 */
export function AppHeader(): JSX.Element | null {
  const { data } = useMe();
  if (!data) return null;

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 h-14 border-b border-border bg-canvas/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-6 md:gap-4">
        <Link
          to="/"
          aria-label="Trang chủ Nexlab Onboarding"
          className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <NxLogo size={28} />
        </Link>
        <BreadcrumbBar inline />
        <div className="ml-auto max-w-md flex-1 sm:max-w-sm md:max-w-md">
          <SearchInput />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <UserMenu user={data.user} />
        </div>
      </div>
    </header>
  );
}
