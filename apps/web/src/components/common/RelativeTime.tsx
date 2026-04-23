import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeVi } from "@/lib/relativeTime";

interface RelativeTimeProps {
  iso: string;
  className?: string;
  showIcon?: boolean;
}

export function RelativeTime({ iso, className, showIcon = true }: RelativeTimeProps): JSX.Element {
  const date = new Date(iso);
  const fullTitle = date.toLocaleString("vi-VN");
  return (
    <time
      dateTime={iso}
      title={fullTitle}
      className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}
    >
      {showIcon ? <Clock aria-hidden="true" className="size-3.5" /> : null}
      <span>{formatRelativeVi(date)}</span>
    </time>
  );
}
