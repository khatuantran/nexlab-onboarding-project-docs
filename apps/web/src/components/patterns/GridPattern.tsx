import { cn } from "@/lib/cn";
import { type PatternTone, toneColor } from "./tone";

interface GridPatternProps {
  tone?: PatternTone;
  opacity?: number;
  density?: "tight" | "loose";
  className?: string;
}

const DENSITY: Record<NonNullable<GridPatternProps["density"]>, { gap: number; dot: number }> = {
  tight: { gap: 12, dot: 1 },
  loose: { gap: 24, dot: 1.5 },
};

export function GridPattern({
  tone = "primary",
  opacity = 0.3,
  density = "loose",
  className,
}: GridPatternProps): JSX.Element {
  const { gap, dot } = DENSITY[density];
  const fill = toneColor(tone);
  const patternId = `grid-${tone}-${density}`;

  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full select-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]",
        className,
      )}
      style={{ opacity }}
    >
      <defs>
        <pattern id={patternId} x="0" y="0" width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={gap / 2} cy={gap / 2} r={dot} fill={fill} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
