import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Thin 6px progress bar, primary fill, animated transition.
 * Per visual-language §10 progress block pattern.
 */
export function ProgressBar({ value, className, ariaLabel }: ProgressBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
