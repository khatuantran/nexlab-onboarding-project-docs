import logoLockup from "@/assets/logo-nexlab.svg";
import logoMarkUrl from "@/assets/logo-nexlab-mark.svg";
import { cn } from "@/lib/cn";

/**
 * Nexlab brand logo (ADR-003 §2.4).
 * - `lockup` (default): full horizontal lockup (bird + wordmark).
 * - `mark`: bird mark only, rendered via SVG mask với orange→peach gradient.
 */
interface NxLogoProps {
  variant?: "lockup" | "mark";
  size?: number;
  className?: string;
  label?: string;
}

export function NxLogo({
  variant = "lockup",
  size = 32,
  className,
  label = "Nexlab",
}: NxLogoProps): JSX.Element {
  if (variant === "mark") {
    return (
      <span
        role="img"
        aria-label={label}
        className={cn("inline-block bg-gradient-to-r from-[#FF9200] to-[#FFD092]", className)}
        style={{
          height: size,
          aspectRatio: "88/100",
          WebkitMask: `url(${logoMarkUrl}) no-repeat center / contain`,
          mask: `url(${logoMarkUrl}) no-repeat center / contain`,
        }}
      />
    );
  }

  return (
    <img
      src={logoLockup}
      alt={label}
      className={cn("block w-auto select-none", className)}
      style={{ height: size }}
      draggable={false}
    />
  );
}
