import { cn } from "@/lib/cn";

interface SectionDotsProps {
  filled: number;
  total?: number;
  className?: string;
}

/**
 * Inline row of N dots (default 5) showing how many sections are filled.
 * Per visual-language §10. Used Feature card footer.
 */
export function SectionDots({ filled, total = 5, className }: SectionDotsProps): JSX.Element {
  const dots = Array.from({ length: total }, (_, i) => i < filled);
  return (
    <span
      aria-label={`${filled}/${total} sections có nội dung`}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {dots.map((on, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn("size-2 rounded-full", on ? "bg-primary" : "bg-muted")}
        />
      ))}
    </span>
  );
}
