import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type FloatTone = "primary" | "info" | "success" | "warning";

interface FloatStatProps {
  icon: LucideIcon;
  tone: FloatTone;
  value: string;
  label: string;
  delta?: string;
  className?: string;
}

const TONE: Record<FloatTone, { ring: string; delta: string }> = {
  primary: { ring: "bg-primary/10 text-primary", delta: "text-primary-700 dark:text-primary-300" },
  info: { ring: "bg-info/10 text-info", delta: "text-info" },
  success: { ring: "bg-success/10 text-success", delta: "text-success" },
  warning: { ring: "bg-warning/10 text-warning", delta: "text-warning" },
};

/**
 * Glassmorphism floating stat card per visual-language §10. Used Login
 * brand panel collage. Caller positions via `className` (e.g., absolute
 * top/left offsets).
 */
export function FloatStat({
  icon: Icon,
  tone,
  value,
  label,
  delta,
  className,
}: FloatStatProps): JSX.Element {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        "w-60 rounded-2xl bg-white/92 dark:bg-card/90 backdrop-blur-md p-4 flex flex-col gap-2.5 ring-1 ring-white/60 dark:ring-border shadow-[0_12px_32px_rgba(149,59,23,0.16)]",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn("inline-flex size-9 items-center justify-center rounded-lg", t.ring)}
          aria-hidden="true"
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="font-ui text-xs leading-snug text-muted-foreground">{label}</span>
      </div>
      <div className="font-display text-[28px] leading-none font-bold tracking-[-0.02em] tabular-nums">
        {value}
      </div>
      {delta ? <div className={cn("font-ui text-xs font-medium", t.delta)}>{delta}</div> : null}
    </div>
  );
}
