import { cn } from "@/lib/cn";
import { avatarBucket, avatarInitial } from "@/lib/avatarHash";

interface ProjectAvatarProps {
  seed: string;
  name: string;
  size?: 32 | 40 | 44 | 56 | 80;
  letters?: 1 | 2;
  className?: string;
}

const SIZE_CLS: Record<number, string> = {
  32: "size-8 text-sm",
  40: "size-10 text-base",
  44: "size-11 text-base",
  56: "size-14 text-2xl",
  80: "size-20 text-3xl",
};

/**
 * Deterministic gradient letter avatar for projects (visual-language §10).
 * `seed` (slug) chooses 1 of 5 primary-ramp buckets; `name` provides initials.
 */
export function ProjectAvatar({
  seed,
  name,
  size = 44,
  letters = 2,
  className,
}: ProjectAvatarProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-lg shadow-sm font-display font-bold text-white bg-gradient-to-br shrink-0 ring-1 ring-primary-200/40 dark:ring-primary-700/40",
        SIZE_CLS[size],
        avatarBucket(seed),
        className,
      )}
    >
      {avatarInitial(name, letters)}
    </span>
  );
}
