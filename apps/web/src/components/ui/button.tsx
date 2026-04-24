import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Nexlab Button (ADR-003).
 *
 * Note: Plan file proposed `default = gold (secondary)`, `orange = primary`.
 * Deviated to `default = orange (primary-500)` cho internal portal context —
 * CTAs (Đăng nhập / Tạo project / Lưu) cần visual weight. Gold variant
 * exposed cho softer actions. Active-state specifically `orange` vẫn giữ
 * consistent (since default is already orange). Nexlab source kit has
 * default=gold but that's tuned cho order/e-commerce UI density.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-ui text-sm font-bold tracking-[0.1px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-600 active:scale-[0.98]",
        gold: "bg-secondary text-secondary-foreground hover:brightness-95 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-95 active:scale-[0.98]",
        outline: "border border-border bg-background text-foreground hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-8",
        sm: "h-8 px-6 text-[13px]",
        lg: "h-14 px-8 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
