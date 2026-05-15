import { cn } from "@/lib/cn";
import { type PatternTone, toneColor } from "./tone";

interface DotFieldProps {
  tone?: PatternTone;
  opacity?: number;
  count?: number;
  className?: string;
}

interface Dot {
  cx: number;
  cy: number;
  r: number;
}

function seededDots(count: number, seed = 42): Dot[] {
  let x = seed;
  const rand = (): number => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  return Array.from({ length: count }, () => ({
    cx: rand() * 200,
    cy: rand() * 200,
    r: 2 + rand() * 6,
  }));
}

export function DotField({
  tone = "primary",
  opacity = 0.3,
  count = 14,
  className,
}: DotFieldProps): JSX.Element {
  const dots = seededDots(count);
  const fill = toneColor(tone);

  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={cn("pointer-events-none select-none", className)}
      style={{ opacity }}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={fill} />
      ))}
    </svg>
  );
}
