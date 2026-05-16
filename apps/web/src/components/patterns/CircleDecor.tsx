import { cn } from "@/lib/cn";

interface CircleDecorProps {
  opacity?: number;
  className?: string;
}

/**
 * Subtle decorative SVG — 2 overlapping circles for tile bottom-right
 * corner per visual-language §10 (CR-006 v3.1). Uses currentColor so the
 * caller controls tint via text-{color} class on the wrapper. aria-hidden.
 */
export function CircleDecor({ opacity = 0.18, className }: CircleDecorProps): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={cn("pointer-events-none select-none", className)}
      style={{ opacity }}
    >
      <circle cx="160" cy="180" r="70" fill="currentColor" />
      <circle cx="200" cy="140" r="50" fill="currentColor" />
    </svg>
  );
}
