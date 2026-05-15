import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ProjectFilter = "all" | "active" | "draft";

interface ProjectFilterMenuProps {
  value: ProjectFilter;
  onChange: (next: ProjectFilter) => void;
}

const ITEMS: Array<{ id: ProjectFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "active", label: "Đang viết" },
  { id: "draft", label: "Cần bổ sung" },
];

export function ProjectFilterMenu({ value, onChange }: ProjectFilterMenuProps): JSX.Element {
  const active = ITEMS.find((item) => item.id === value) ?? ITEMS[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Lọc dự án"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 font-ui text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Filter aria-hidden="true" className="size-3.5 text-muted-foreground" />
          <span>Lọc</span>
          {value !== "all" ? (
            <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {active.label}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => onChange(item.id)}
            className={item.id === value ? "font-semibold text-primary" : undefined}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
