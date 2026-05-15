import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import {
  updateUserRequestSchema,
  type AdminUser,
  type UpdateUserRequest,
} from "@onboarding/shared";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useUpdateUser } from "@/queries/users";
import { messageForCode } from "@/lib/errorMessages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditUserDialogProps {
  user: AdminUser;
  open: boolean;
  onOpenChange(next: boolean): void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps): JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null);
  const mutation = useUpdateUser();

  const form = useForm<UpdateUserRequest>({
    resolver: zodResolver(updateUserRequestSchema),
    defaultValues: { displayName: user.displayName, role: user.role },
    mode: "onSubmit",
  });

  const { register, handleSubmit, reset, formState } = form;

  useEffect(() => {
    if (open) {
      reset({ displayName: user.displayName, role: user.role });
      setServerError(null);
    }
  }, [open, user, reset]);

  const onSubmit = (values: UpdateUserRequest): void => {
    setServerError(null);
    mutation.mutate(
      { id: user.id, patch: values },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật user");
          onOpenChange(false);
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            setServerError(messageForCode(err.code));
          } else {
            setServerError("Có lỗi xảy ra, thử lại sau");
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa user</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{user.email}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="eu-name">Tên hiển thị *</Label>
              <Input
                id="eu-name"
                autoFocus
                aria-invalid={!!formState.errors.displayName || undefined}
                {...register("displayName")}
              />
              {formState.errors.displayName && (
                <p role="alert" className="text-xs text-destructive">
                  {formState.errors.displayName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eu-role">Role *</Label>
              <select
                id="eu-role"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("role")}
              >
                <option value="author">Author</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {serverError && (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
              <Save className="mr-2 size-4" aria-hidden="true" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
