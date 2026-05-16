import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";

interface SearchInputProps {
  /** v4 pill style: h-38 rounded-10 border-1.5 + ⌘K kbd badge. */
  pill?: boolean;
}

function detectProjectSlug(pathname: string): string | undefined {
  const match = /^\/projects\/([^/]+)/u.exec(pathname);
  return match?.[1];
}

export function SearchInput({ pill = false }: SearchInputProps): JSX.Element {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const params = new URLSearchParams({ q: trimmed });
    const scope = detectProjectSlug(location.pathname);
    if (scope) params.set("projectSlug", scope);

    navigate(`/search?${params.toString()}`);
  };

  if (pill) {
    return (
      <form
        role="search"
        onSubmit={handleSubmit}
        className="group flex h-[38px] w-full max-w-[400px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-border bg-muted/50 px-3.5 transition-all focus-within:border-primary focus-within:bg-card focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]"
      >
        <Search
          className="size-[15px] shrink-0 text-muted-foreground group-focus-within:text-primary"
          aria-hidden="true"
        />
        <input
          type="search"
          role="searchbox"
          aria-label="Tìm project, feature, người"
          placeholder="Tìm project, feature, người..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 border-0 bg-transparent font-ui text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <kbd
          aria-hidden="true"
          className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 font-ui text-[11px] font-semibold text-muted-foreground"
        >
          ⌘K
        </kbd>
      </form>
    );
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative flex w-full items-center">
      <Search
        className={cn("pointer-events-none absolute left-3.5 size-4 text-muted-foreground")}
        aria-hidden="true"
      />
      <input
        type="search"
        role="searchbox"
        aria-label="Tìm dự án / feature"
        placeholder="Tìm dự án, feature..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 w-full rounded-full border-0 bg-muted/60 pl-10 pr-4 font-ui text-sm text-foreground placeholder:text-muted-foreground focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
    </form>
  );
}
