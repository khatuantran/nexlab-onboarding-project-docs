import { cn } from "@/lib/cn";
import { avatarBucket, avatarInitial } from "@/lib/avatarHash";
import type { PatternTone } from "@/components/patterns/tone";

interface ProjectAvatarProps {
  seed: string;
  name: string;
  size?: 32 | 40 | 44 | 56 | 80;
  letters?: 1 | 2;
  accent?: PatternTone;
  className?: string;
}

const SIZE_CLS: Record<number, string> = {
  32: "size-8 text-sm",
  40: "size-10 text-base",
  44: "size-11 text-base",
  56: "size-14 text-2xl",
  80: "size-20 text-3xl",
};

// CR-005 v3: when `accent` is set, override primary-ramp bucket with an
// accent-tone gradient via inline style (avoids Tailwind safelist gymnastics).
const ACCENT_VAR: Record<PatternTone, string> = {
  primary: "--primary",
  blue: "--accent-blue",
  green: "--accent-green",
  purple: "--accent-purple",
  pink: "--accent-pink",
  cyan: "--accent-cyan",
  amber: "--accent-amber",
};

export function ProjectAvatar({
  seed,
  name,
  size = 44,
  letters = 2,
  accent,
  className,
}: ProjectAvatarProps): JSX.Element {
  const accentStyle = accent
    ? {
        backgroundImage: `linear-gradient(to bottom right, hsl(var(${ACCENT_VAR[accent]}) / 0.85), hsl(var(${ACCENT_VAR[accent]})))`,
      }
    : undefined;

  return (
    <span
      aria-hidden="true"
      style={accentStyle}
      className={cn(
        "inline-flex items-center justify-center rounded-lg shadow-sm font-display font-bold text-white shrink-0 ring-1",
        SIZE_CLS[size],
        accent
          ? "ring-white/20"
          : ["bg-gradient-to-br ring-primary-200/40 dark:ring-primary-700/40", avatarBucket(seed)],
        className,
      )}
    >
      {avatarInitial(name, letters)}
    </span>
  );
}
