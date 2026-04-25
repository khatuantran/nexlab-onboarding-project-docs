import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TipCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Info-tinted callout card per visual-language §10.
 * Used Feature detail activity rail bottom + Search idle state.
 */
export function TipCard({ title, children, className }: TipCardProps): JSX.Element {
  return (
    <div
      role="note"
      className={cn(
        "rounded-lg border border-info/30 bg-info/10 p-3.5 text-foreground/80",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Info aria-hidden="true" className="size-3.5 text-info" />
        <span className="font-ui text-xs font-bold uppercase tracking-wide text-info">{title}</span>
      </div>
      <div className="font-body text-xs leading-snug">{children}</div>
    </div>
  );
}
