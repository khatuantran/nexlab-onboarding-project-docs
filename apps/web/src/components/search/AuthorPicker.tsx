import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers, type UserListItem } from "@/queries/users";

export interface AuthorPickerProps {
  value: string | undefined;
  onChange: (next: { id: string; displayName: string } | undefined) => void;
  /**
   * Pre-known display name of the current authorId, so we can render the
   * trigger label without needing the full user list to resolve first.
   */
  selectedDisplayName?: string;
}

const DEBOUNCE_MS = 300;

export function AuthorPicker({
  value,
  onChange,
  selectedDisplayName,
}: AuthorPickerProps): JSX.Element {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  const { data, isLoading } = useUsers({ q: debounced });

  const triggerLabel = value ? (selectedDisplayName ?? "Tác giả đã chọn") : "Tất cả tác giả";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-haspopup="listbox"
        aria-label={`Tác giả: ${triggerLabel}`}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2.5 font-ui text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {triggerLabel}
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2" role="listbox">
        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tìm tác giả..."
            className="flex-1 bg-transparent font-body text-xs outline-none"
            aria-label="Tìm tác giả"
          />
        </label>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => onChange(undefined)}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-left font-ui text-xs hover:bg-muted"
          >
            Tất cả tác giả
          </button>
          {isLoading && (
            <p className="px-2 py-1.5 font-body text-xs text-muted-foreground">Đang tải...</p>
          )}
          {data?.map((user: UserListItem) => (
            <button
              key={user.id}
              type="button"
              role="option"
              aria-selected={value === user.id}
              onClick={() => onChange({ id: user.id, displayName: user.displayName })}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-ui text-xs hover:bg-muted"
            >
              <span>{user.displayName}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {user.role}
              </span>
            </button>
          ))}
          {!isLoading && data && data.length === 0 && (
            <p className="px-2 py-1.5 font-body text-xs text-muted-foreground">
              Không tìm thấy tác giả
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
