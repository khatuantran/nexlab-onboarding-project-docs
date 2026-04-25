import { cn } from "@/lib/cn";

interface ProgressStripProps {
  filled: number;
  total: number;
  labels: string[];
  className?: string;
}

/**
 * Feature header progress strip per visual-language §10.
 * Big fraction left + N segments middle + segment labels below.
 */
export function ProgressStrip({
  filled,
  total,
  labels,
  className,
}: ProgressStripProps): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center gap-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-display text-[22px] leading-none font-bold text-primary tabular-nums">
          {filled}
        </span>
        <span className="font-ui text-[11px] leading-tight text-muted-foreground">
          /{total}
          <br />
          section đã có
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex gap-1.5" aria-hidden="true">
          {labels.map((_, i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", i < filled ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
        <div className="flex justify-between font-ui text-[10px] text-muted-foreground gap-1">
          {labels.map((l, i) => (
            <span key={i} className="truncate">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
