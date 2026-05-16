interface ProgressRingProps {
  /** 0-100. Clamped. */
  pct: number;
  /** Outer diameter in px. Default 52. */
  size?: number;
  /** Stroke color of the filled arc. CSS color expression. */
  color?: string;
  /** Track color (the background ring). CSS color expression. */
  bg?: string;
  /** Stroke width in px. Default 6. */
  strokeWidth?: number;
  className?: string;
}

/**
 * SVG circular progress ring (CR-006 v4 primitive). 2 concentric circles
 * rotated -90deg so the fill starts at 12 o'clock. Used in ProjectCard
 * header, FeatureTile, FeatureDetail progress.
 */
export function ProgressRing({
  pct,
  size = 52,
  color = "hsl(var(--primary))",
  bg = "hsl(var(--muted))",
  strokeWidth = 6,
  className,
}: ProgressRingProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);
  return (
    <svg
      role="img"
      aria-label={`Tiến độ ${clamped}%`}
      width={size}
      height={size}
      className={className}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
