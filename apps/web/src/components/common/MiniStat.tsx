import { cn } from "@/lib/cn";

interface MiniStatProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "primary";
  live?: boolean;
  className?: string;
}

/**
 * Inline hero mini-stat (vertical: label / value / sub).
 * Used Project Landing hero for cluster of 4 stats.
 */
export function MiniStat({
  label,
  value,
  sub,
  tone = "default",
  live,
  className,
}: MiniStatProps): JSX.Element {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-ui text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-display text-[22px] leading-none font-bold",
          tone === "primary" ? "text-primary" : "text-foreground",
        )}
      >
        {live ? (
          <span aria-hidden="true" className="size-2 rounded-full bg-success-500 animate-pulse" />
        ) : null}
        <span className="tabular-nums">{value}</span>
      </span>
      {sub ? (
        <span className="font-body text-xs leading-tight text-muted-foreground">{sub}</span>
      ) : null}
    </div>
  );
}
