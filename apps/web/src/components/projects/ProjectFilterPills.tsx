import { cn } from "@/lib/cn";

export type ProjectFilter = "all" | "active" | "draft";

interface ProjectFilterPillsProps {
  value: ProjectFilter;
  onChange: (next: ProjectFilter) => void;
  className?: string;
}

const ITEMS: Array<{ id: ProjectFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "active", label: "Đang viết" },
  { id: "draft", label: "Cần bổ sung" },
];

/**
 * Inline filter pill group per home.md spec. Active pill uses card bg
 * + shadow lift; idle pills muted ghost. Client-side filter only v1.
 */
export function ProjectFilterPills({
  value,
  onChange,
  className,
}: ProjectFilterPillsProps): JSX.Element {
  return (
    <div
      role="tablist"
      aria-label="Lọc project"
      className={cn("flex items-center gap-1", className)}
    >
      {ITEMS.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-md px-3 py-1.5 font-ui text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
