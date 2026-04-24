import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-32 w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-foreground leading-relaxed",
        "placeholder:text-muted-foreground",
        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
