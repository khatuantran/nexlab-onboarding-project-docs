import { NxLogo } from "@/components/common/NxLogo";
import { cn } from "@/lib/cn";

interface DecorativeMarkProps {
  className?: string;
  size?: number;
}

/**
 * Decorative NxLogo mark watermark for hero corners (visual-language §10).
 * Caller positions via `className` (e.g. absolute inset offsets); mark itself
 * is gradient-masked with low opacity rotated for collage feel. aria-hidden.
 */
export function DecorativeMark({ className, size = 320 }: DecorativeMarkProps): JSX.Element {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none select-none", className)}>
      <NxLogo variant="mark" size={size} className="opacity-[0.18] -rotate-[8deg]" />
    </span>
  );
}
