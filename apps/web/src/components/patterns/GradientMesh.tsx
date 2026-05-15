import { cn } from "@/lib/cn";
import { type PatternTone, toneColor } from "./tone";

interface GradientMeshProps {
  tones?: PatternTone[];
  opacity?: number;
  className?: string;
}

export function GradientMesh({
  tones = ["primary", "amber"],
  opacity = 0.25,
  className,
}: GradientMeshProps): JSX.Element {
  const stops = tones.slice(0, 3);
  const positions = [
    { x: "15%", y: "20%", size: "55%" },
    { x: "85%", y: "30%", size: "45%" },
    { x: "50%", y: "85%", size: "50%" },
  ];

  const layers = stops
    .map((tone, i) => {
      const pos = positions[i % positions.length]!;
      const color = toneColor(tone);
      return `radial-gradient(circle at ${pos.x} ${pos.y}, ${color} 0%, transparent ${pos.size})`;
    })
    .join(", ");

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 select-none", className)}
      style={{ backgroundImage: layers, opacity }}
    />
  );
}
