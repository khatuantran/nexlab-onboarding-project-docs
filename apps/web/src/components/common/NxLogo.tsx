import logoLockupRaw from "@/assets/logo-nexlab.svg?raw";
import logoMarkUrl from "@/assets/logo-nexlab-mark.svg";
import { cn } from "@/lib/cn";

/**
 * Nexlab brand logo (ADR-003 §2.4).
 * - `lockup` (default): inline SVG nên `currentColor` (wordmark) inherit
 *   `text-foreground` → đọc được cả light & dark mode. Bird vẫn dùng gradient.
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
    <span
      role="img"
      aria-label={label}
      className={cn("inline-block select-none text-foreground", className)}
      style={{ height: size, aspectRatio: "420/100" }}
      // SVG markup ships with viewBox + fill="currentColor" on wordmark paths
      dangerouslySetInnerHTML={{
        __html: logoLockupRaw.replace(
          /<svg([^>]*)>/u,
          `<svg$1 style="height:100%;width:auto;display:block">`,
        ),
      }}
    />
  );
}
