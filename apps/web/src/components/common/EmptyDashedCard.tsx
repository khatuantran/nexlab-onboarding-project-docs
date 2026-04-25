import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyDashedCardProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Inline dashed empty card per visual-language §10.
 * Different from page-level EmptyState — this is in-flow inside cards/sections.
 */
export function EmptyDashedCard({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyDashedCardProps): JSX.Element {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3.5 rounded-lg border border-dashed border-border bg-muted/30 px-5 py-5",
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card shrink-0">
          <Icon aria-hidden="true" className="size-[18px] text-muted-foreground" />
        </span>
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 font-body text-xs leading-snug text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
