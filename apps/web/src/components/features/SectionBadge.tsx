import { cn } from "@/lib/cn";

interface SectionBadgeProps {
  filled: number;
  total: number;
  className?: string;
}

export function SectionBadge({ filled, total, className }: SectionBadgeProps): JSX.Element {
  const complete = filled >= total;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium",
        complete ? "text-foreground" : "text-muted-foreground",
        className,
      )}
      aria-label={`${filled} trong ${total} section đã điền`}
    >
      {filled}/{total}
    </span>
  );
}
