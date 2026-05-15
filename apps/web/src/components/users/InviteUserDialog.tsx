import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { inviteUserRequestSchema, type InviteUserRequest } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useInviteUser } from "@/queries/users";
import { messageForCode } from "@/lib/errorMessages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TempPasswordModal } from "./TempPasswordModal";

export function InviteUserDialog(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState<{ email: string; tempPassword: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const mutation = useInviteUser();

  const form = useForm<InviteUserRequest>({
    resolver: zodResolver(inviteUserRequestSchema),
    defaultValues: { email: "", displayName: "", role: "author" },
    mode: "onSubmit",
  });

  const { register, handleSubmit, reset, formState } = form;

  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      reset({ email: "", displayName: "", role: "author" });
      setServerError(null);
    }
    setOpen(next);
  };

  const onSubmit = (values: InviteUserRequest): void => {
    setServerError(null);
    mutation.mutate(values, {
      onSuccess: (data) => {
        setReveal({ email: data.user.email, tempPassword: data.tempPassword });
        setOpen(false);
        reset({ email: "", displayName: "", role: "author" });
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          setServerError(messageForCode(err.code));
        } else {
          setServerError("Có lỗi xảy ra, thử lại sau");
        }
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <UserPlus className="mr-2 size-4" aria-hidden="true" />
            Mời user mới
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mời user mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản với mật khẩu tạm — hệ thống sẽ hiển thị 1 lần cho bạn copy.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4 px-6 pb-4">
              <div className="space-y-1.5">
                <Label htmlFor="iu-email">Email *</Label>
                <Input
                  id="iu-email"
                  type="email"
                  autoFocus
                  autoComplete="off"
                  aria-invalid={!!formState.errors.email || undefined}
                  {...register("email")}
                />
                {formState.errors.email && (
                  <p role="alert" className="text-xs text-destructive">
                    {formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iu-name">Tên hiển thị *</Label>
                <Input
                  id="iu-name"
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
                <Label htmlFor="iu-role">Role *</Label>
                <select
                  id="iu-role"
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
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
                <UserPlus className="mr-2 size-4" aria-hidden="true" />
                Mời user
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TempPasswordModal
        open={reveal !== null}
        onOpenChange={(o) => !o && setReveal(null)}
        email={reveal?.email ?? ""}
        tempPassword={reveal?.tempPassword ?? ""}
        title="User đã được tạo"
      />
    </>
  );
}
