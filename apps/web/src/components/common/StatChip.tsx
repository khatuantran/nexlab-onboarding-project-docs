import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type StatTone = "primary" | "success" | "info" | "warning";

interface StatChipProps {
  icon: LucideIcon;
  tone: StatTone;
  value: string | number;
  label: string;
  className?: string;
}

const TONE_PLATE: Record<StatTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
};

/**
 * Hero stat row chip per visual-language §10. Use for cluster of 3-4
 * metrics in page heros (Home stat row).
 */
export function StatChip({
  icon: Icon,
  tone,
  value,
  label,
  className,
}: StatChipProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg",
          TONE_PLATE[tone],
        )}
        aria-hidden="true"
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="flex flex-col">
        <span className="font-display text-lg leading-none font-bold tabular-nums">{value}</span>
        <span className="mt-1 font-ui text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
