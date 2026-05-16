import { Link } from "react-router-dom";
import { NxLogo } from "@/components/common/NxLogo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { SearchInput } from "@/components/search/SearchInput";
import { useMe } from "@/queries/auth";

/**
 * AppHeader v4 (CR-006 v4 — dark vivid).
 *
 * Single-row h-16 solid chrome. Layout: NxLogo (26) + vertical divider +
 * optional inline breadcrumb · pill SearchInput (max-w-400) with ⌘K kbd ·
 * Bell (red dot) + ThemeToggle + UserMenu pill (initials gradient +
 * name + role). v3 translucent canvas bg replaced with solid background
 * for contrast against the dark hero below.
 */
export function AppHeader(): JSX.Element | null {
  const { data } = useMe();
  if (!data) return null;

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background px-6"
    >
      <Link
        to="/"
        aria-label="Trang chủ Nexlab Onboarding"
        className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <NxLogo size={26} />
      </Link>
      <span aria-hidden="true" className="h-[22px] w-px shrink-0 bg-border" />
      <div className="max-w-[400px] flex-1">
        <SearchInput pill />
      </div>
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
      </div>
      <UserMenu user={data.user} />
    </header>
  );
}
