import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function detectProjectSlug(pathname: string): string | undefined {
  const match = /^\/projects\/([^/]+)/u.exec(pathname);
  return match?.[1];
}

export function SearchInput(): JSX.Element {
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

  return (
    <form role="search" onSubmit={handleSubmit} className="relative flex w-full items-center">
      <Search
        className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground"
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
