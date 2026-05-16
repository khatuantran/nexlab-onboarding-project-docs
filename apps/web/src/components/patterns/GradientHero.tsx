import type { ReactNode } from "react";
import { LogoWatermark } from "@/components/patterns/LogoWatermark";
import { cn } from "@/lib/cn";

export interface HeroBlob {
  /** Tailwind `bg-{...}` accent class OR raw CSS color expression for the
   *  radial gradient core. Examples: "primary", "purple-500", "#10B981". */
  color: string;
  /** Diameter in px. */
  size?: number;
  /** Position offsets (negative pushes outside the hero box). */
  pos?: { top?: number; right?: number; bottom?: number; left?: number };
  /** 0-1 opacity. Default 0.4. */
  opacity?: number;
}

interface GradientHeroProps {
  /** Up to 3 radial color blobs (default = orange + purple + blue). */
  blobs?: HeroBlob[];
  /** Show LogoWatermark slot in top-right. */
  showWatermark?: boolean;
  /** Apply .dot-grid overlay. */
  gridOverlay?: boolean;
  className?: string;
  children?: ReactNode;
}

const DEFAULT_BLOBS: HeroBlob[] = [
  {
    color: "rgba(240,118,19,0.4)",
    size: 360,
    pos: { top: -60, left: -40 },
    opacity: 1,
  },
  {
    color: "rgba(139,92,246,0.35)",
    size: 280,
    pos: { top: -40, right: 200 },
    opacity: 1,
  },
  {
    color: "rgba(59,130,246,0.3)",
    size: 300,
    pos: { bottom: -30, right: -20 },
    opacity: 1,
  },
];

/**
 * Dark vivid hero wrapper (CR-006 v4 primitive). Container with the dark
 * gradient bg + configurable radial color blobs + optional dot-grid
 * overlay + optional `<LogoWatermark>` + children slot.
 *
 * Reusable across HomePage hero, ProjectLanding hero, FeatureDetail
 * hero, Users hero, Settings hero, Profile cover, Login left panel.
 */
export function GradientHero({
  blobs = DEFAULT_BLOBS,
  showWatermark = false,
  gridOverlay = false,
  className,
  children,
}: GradientHeroProps): JSX.Element {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-br from-[hsl(var(--hero-1))] via-[hsl(var(--hero-2))] to-[hsl(var(--hero-4))]",
        className,
      )}
    >
      {/* Radial color blobs */}
      {blobs.map((blob, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          style={{
            width: blob.size ?? 280,
            height: blob.size ?? 280,
            top: blob.pos?.top,
            right: blob.pos?.right,
            bottom: blob.pos?.bottom,
            left: blob.pos?.left,
            opacity: blob.opacity ?? 1,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 65%)`,
          }}
        />
      ))}
      {/* Dot-grid overlay */}
      {gridOverlay ? (
        <div
          aria-hidden="true"
          className="dot-grid pointer-events-none absolute inset-0 opacity-60"
        />
      ) : null}
      {/* Logo watermark — top-right corner */}
      {showWatermark ? (
        <LogoWatermark size={380} opacity={0.12} className="-right-8 -top-8" />
      ) : null}
      {/* Children slot — must be inside `relative` wrapper to layer above blobs */}
      <div className="relative">{children}</div>
    </section>
  );
}
