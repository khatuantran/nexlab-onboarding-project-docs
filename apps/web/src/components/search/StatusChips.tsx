import type { FeatureStatus } from "@onboarding/shared";
import { cn } from "@/lib/cn";

const STATUS_LABELS: Record<FeatureStatus, string> = {
  filled: "Đủ doc",
  partial: "Đang viết",
  empty: "Chưa có",
};

const ORDER: FeatureStatus[] = ["filled", "partial", "empty"];

export interface StatusChipsProps {
  value: FeatureStatus | undefined;
  onChange: (next: FeatureStatus | undefined) => void;
}

/**
 * Single-select chip group with toggle-clear: clicking the active chip
 * removes the filter rather than turning it off-then-on. Status values
 * are mutually exclusive (filled / partial / empty), so multi-select
 * would be incoherent.
 */
export function StatusChips({ value, onChange }: StatusChipsProps): JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label="Lọc theo trạng thái feature"
      className="flex flex-wrap gap-1.5"
    >
      {ORDER.map((status) => {
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? undefined : status)}
            className={cn(
              "inline-flex h-7 items-center rounded-md px-3 font-ui text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}
