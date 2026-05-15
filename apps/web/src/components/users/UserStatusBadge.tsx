import { cn } from "@/lib/cn";

interface UserStatusBadgeProps {
  archivedAt: string | null;
  className?: string;
}

export function UserStatusBadge({ archivedAt, className }: UserStatusBadgeProps): JSX.Element {
  const disabled = archivedAt !== null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-ui text-[11px] font-bold uppercase tracking-wide",
        disabled ? "bg-muted text-muted-foreground" : "bg-success/15 text-success",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          disabled ? "bg-muted-foreground/60" : "bg-success animate-pulse",
        )}
      />
      {disabled ? "Disabled" : "Active"}
    </span>
  );
}
