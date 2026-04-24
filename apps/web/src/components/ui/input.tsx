import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Nexlab field (ADR-003): 48px tall, radius 8, border-border default,
 * focus border primary-500 + subtle 2px ring. Error state: consumer passes
 * `aria-invalid="true"` → border-destructive auto.
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-12 w-full rounded-lg border border-border bg-background px-4 py-2 font-ui text-sm text-foreground",
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
Input.displayName = "Input";
