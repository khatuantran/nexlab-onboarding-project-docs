import { cn } from "@/lib/cn";
import { type PatternTone, toneColor } from "./tone";

interface WaveDividerProps {
  tone?: PatternTone;
  opacity?: number;
  flip?: boolean;
  className?: string;
}

export function WaveDivider({
  tone = "primary",
  opacity = 0.3,
  flip = false,
  className,
}: WaveDividerProps): JSX.Element {
  const fill = toneColor(tone);

  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn("pointer-events-none w-full select-none", flip && "rotate-180", className)}
      style={{ opacity }}
    >
      <path
        d="M0,64 C240,112 480,16 720,48 C960,80 1200,112 1440,64 L1440,120 L0,120 Z"
        fill={fill}
      />
    </svg>
  );
}
