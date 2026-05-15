import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PatternTone } from "@/components/patterns/tone";

type StatTone = "primary" | "success" | "info" | "warning" | PatternTone;

interface StatChipProps {
  icon: LucideIcon;
  tone: StatTone;
  value: string | number;
  label: string;
  topAccent?: boolean;
  className?: string;
}

const TONE_PLATE: Record<StatTone, string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  blue: "bg-accent-blue text-white",
  green: "bg-accent-green text-white",
  purple: "bg-accent-purple text-white",
  pink: "bg-accent-pink text-white",
  cyan: "bg-accent-cyan text-white",
  amber: "bg-accent-amber text-white",
};

const TONE_BAR: Record<StatTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  blue: "bg-accent-blue",
  green: "bg-accent-green",
  purple: "bg-accent-purple",
  pink: "bg-accent-pink",
  cyan: "bg-accent-cyan",
  amber: "bg-accent-amber",
};

export function StatChip({
  icon: Icon,
  tone,
  value,
  label,
  topAccent = false,
  className,
}: StatChipProps): JSX.Element {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card px-4 py-3",
        className,
      )}
    >
      {topAccent ? (
        <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1", TONE_BAR[tone])} />
      ) : null}
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-lg shadow-sm",
          TONE_PLATE[tone],
        )}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col">
        <span className="font-display text-[28px] leading-none font-bold tabular-nums">
          {value}
        </span>
        <span className="mt-1 font-ui text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
