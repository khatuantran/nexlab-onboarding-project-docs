import { cn } from "@/lib/cn";
import { type PatternTone, toneColor } from "./tone";

interface BlobBackdropProps {
  tone?: PatternTone;
  opacity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX: Record<NonNullable<BlobBackdropProps["size"]>, number> = {
  sm: 240,
  md: 360,
  lg: 480,
};

export function BlobBackdrop({
  tone = "primary",
  opacity = 0.3,
  size = "md",
  className,
}: BlobBackdropProps): JSX.Element {
  const px = SIZE_PX[size];
  const fill = toneColor(tone);
  const gradientId = `blob-${tone}-${size}`;

  return (
    <svg
      aria-hidden="true"
      width={px}
      height={px}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none select-none", className)}
      style={{ opacity }}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <path
        d="M44.3,-58.5C56.6,-49.7,65.1,-34.9,68.2,-19.3C71.3,-3.6,69,12.9,61.7,26.8C54.4,40.7,42.2,52,28,59.3C13.8,66.6,-2.4,69.9,-17.4,66C-32.3,62,-46.1,50.9,-55.1,37C-64.1,23.1,-68.4,6.5,-65.9,-8.6C-63.5,-23.7,-54.2,-37.3,-42.1,-46.7C-30,-56.1,-15,-61.3,1.5,-63.3C18,-65.4,36,-67.2,44.3,-58.5Z"
        transform="translate(100 100)"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}
