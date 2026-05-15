import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Inline keyboard shortcut hint. Visual-only — does not wire any
 * shortcut handler. Used in SearchInput (⌘K) and could be reused in
 * tooltips. Renders as semantic `<kbd>` for screen readers.
 */
export function Kbd({ className, children, ...props }: HTMLAttributes<HTMLElement>): JSX.Element {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-ui text-[10px] font-medium leading-none text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
