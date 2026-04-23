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
    <form role="search" onSubmit={handleSubmit} className="relative flex items-center">
      <Search
        className="pointer-events-none absolute left-2 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        role="searchbox"
        aria-label="Tìm feature"
        placeholder="Tìm kiếm..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 w-56 rounded-md border border-input bg-muted/40 pl-8 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  );
}
