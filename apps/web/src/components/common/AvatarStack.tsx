import { cn } from "@/lib/cn";
import { Avatar } from "@/components/common/Avatar";

interface AvatarStackProps {
  names: string[];
  max?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * Overlapping contributor avatars row. Shows up to `max` (default 3)
 * with a `+N` chip if there are more.
 */
export function AvatarStack({
  names,
  max = 3,
  size = "sm",
  className,
}: AvatarStackProps): JSX.Element | null {
  const visible = names.slice(0, max);
  const overflow = Math.max(0, names.length - max);
  if (visible.length === 0) return null;

  const overflowSize =
    size === "md" ? "size-10 text-xs" : size === "xs" ? "size-6 text-[9px]" : "size-7 text-[10px]";

  return (
    <span className={cn("inline-flex items-center", className)}>
      {visible.map((name, i) => (
        <span key={`${name}-${i}`} className={i === 0 ? "" : "-ml-2"}>
          <Avatar name={name} size={size} />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          aria-label={`+${overflow} người khác`}
          className={cn(
            "-ml-2 inline-flex items-center justify-center rounded-full font-ui font-bold ring-2 ring-background bg-muted text-muted-foreground",
            overflowSize,
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
