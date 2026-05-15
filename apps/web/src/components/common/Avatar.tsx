import { cn } from "@/lib/cn";
import { avatarBucket, avatarInitial } from "@/lib/avatarHash";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const SIZE_CLS: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "size-6 text-[10px] ring-1",
  sm: "size-7 text-[11px] ring-2",
  md: "size-10 text-sm ring-2",
};

/**
 * Singular contributor avatar — circular with gradient initials.
 * For overlapping stacks use `<AvatarStack>` instead.
 */
export function Avatar({ name, size = "sm", className }: AvatarProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br font-ui font-bold text-white ring-background shrink-0",
        SIZE_CLS[size],
        avatarBucket(name),
        className,
      )}
    >
      {avatarInitial(name, 2)}
    </span>
  );
}
