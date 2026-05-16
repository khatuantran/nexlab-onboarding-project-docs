import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  pending?: boolean;
  onConfirm: () => void;
}

/**
 * Reusable confirmation dialog — replaces native `window.confirm` for
 * destructive-ish actions (archive, delete, sign-out elsewhere, ...).
 * Radix Dialog under the hood: keyboard a11y + focus trap + Esc close.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  variant = "destructive",
  pending = false,
  onConfirm,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3 px-6 pt-2">
            {variant === "destructive" ? (
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-destructive/12 text-destructive"
              >
                <AlertTriangle className="size-5" />
              </span>
            ) : null}
            <div className="flex-1">
              <DialogTitle className="font-display text-[17px] font-bold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1.5 font-body text-[14px] leading-[1.55] text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 px-6 pb-4 pt-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Đang xử lý..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
