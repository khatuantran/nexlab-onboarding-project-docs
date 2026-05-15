import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TempPasswordModalProps {
  open: boolean;
  onOpenChange(next: boolean): void;
  email: string;
  tempPassword: string;
  /** Title varies between "Mời user" and "Reset mật khẩu". */
  title?: string;
}

/**
 * Shared modal shown after invite + reset password — surfaces the
 * generated temporary password exactly once with a copy button and a
 * destructive close-out warning. No persistence; closing the modal is
 * the only "save" path.
 */
export function TempPasswordModal({
  open,
  onOpenChange,
  email,
  tempPassword,
  title = "Mật khẩu tạm thời",
}: TempPasswordModalProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success("Đã copy mật khẩu");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không copy được, chọn thủ công");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              <KeyRound className="size-4" aria-hidden="true" />
              {title}
            </span>
          </DialogTitle>
          <DialogDescription>
            Mật khẩu này chỉ hiển thị 1 lần. Hãy copy ngay và gửi cho user qua kênh riêng.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="font-ui text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="mt-1 font-mono text-sm text-foreground">{email}</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="font-ui text-xs uppercase tracking-wide text-primary">Mật khẩu tạm</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 select-all font-mono text-lg font-bold tracking-wide text-foreground">
                {tempPassword}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
                <span className="ml-2">{copied ? "Đã copy" : "Copy"}</span>
              </Button>
            </div>
          </div>
          <p className="text-xs text-destructive">
            ⚠️ Đóng cửa sổ này, mật khẩu sẽ không hiển thị lại. Reset lại nếu cần.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Đã copy, đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
