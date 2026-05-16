import logoMarkUrl from "@/assets/logo-nexlab-mark.svg";
import { cn } from "@/lib/cn";

interface LogoWatermarkProps {
  /** Square outer size in px. Default 280. */
  size?: number;
  /** 0-1 mask opacity. Default 0.12. */
  opacity?: number;
  className?: string;
}

/**
 * NxLogo mark rendered as an absolutely-positioned masked div tinted by
 * the logo gradient. Used inside `GradientHero` for subtle brand
 * watermark in hero corner (CR-006 v4 primitive). aria-hidden +
 * pointer-events-none.
 */
export function LogoWatermark({
  size = 280,
  opacity = 0.12,
  className,
}: LogoWatermarkProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute bg-gradient-to-r from-[hsl(var(--logo-grad-start))] to-[hsl(var(--logo-grad-end))]",
        className,
      )}
      style={{
        width: size,
        height: size,
        opacity,
        WebkitMask: `url(${logoMarkUrl}) no-repeat center / contain`,
        mask: `url(${logoMarkUrl}) no-repeat center / contain`,
      }}
    />
  );
}
