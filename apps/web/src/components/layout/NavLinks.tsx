import { Home, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

const ITEMS: { to: string; label: string; icon: typeof Home }[] = [
  { to: "/", label: "Trang chủ", icon: Home },
  { to: "/search", label: "Tìm kiếm", icon: Search },
];

export function NavLinks(): JSX.Element {
  return (
    <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-3 font-ui text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )
          }
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
