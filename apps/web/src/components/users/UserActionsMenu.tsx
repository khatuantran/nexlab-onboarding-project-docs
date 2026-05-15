import { useState } from "react";
import { Ban, KeyRound, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { AdminUser } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useArchiveUser, useResetUserPassword, useUnarchiveUser } from "@/queries/users";
import { useMe } from "@/queries/auth";
import { messageForCode } from "@/lib/errorMessages";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditUserDialog } from "./EditUserDialog";
import { TempPasswordModal } from "./TempPasswordModal";

interface UserActionsMenuProps {
  user: AdminUser;
}

export function UserActionsMenu({ user }: UserActionsMenuProps): JSX.Element {
  const [editOpen, setEditOpen] = useState(false);
  const [reveal, setReveal] = useState<{ email: string; tempPassword: string } | null>(null);
  const archive = useArchiveUser();
  const unarchive = useUnarchiveUser();
  const reset = useResetUserPassword();
  const { data: me } = useMe();
  const isSelf = me?.user.id === user.id;
  const disabled = user.archivedAt !== null;

  const handleErr = (err: unknown, fallback: string): void => {
    if (err instanceof ApiError) toast.error(messageForCode(err.code) || fallback);
    else toast.error(fallback);
  };

  const onArchive = (): void => {
    if (!window.confirm(`Disable tài khoản "${user.displayName}"? User sẽ không login được nữa.`))
      return;
    archive.mutate(user.id, {
      onSuccess: () => toast.success("Đã disable user"),
      onError: (err) => handleErr(err, "Không disable được"),
    });
  };

  const onUnarchive = (): void => {
    unarchive.mutate(user.id, {
      onSuccess: () => toast.success("Đã enable user"),
      onError: (err) => handleErr(err, "Không enable được"),
    });
  };

  const onReset = (): void => {
    if (
      !window.confirm(`Reset mật khẩu cho "${user.displayName}"? Mọi session hiện tại sẽ bị huỷ.`)
    )
      return;
    reset.mutate(user.id, {
      onSuccess: (data) => setReveal({ email: data.user.email, tempPassword: data.tempPassword }),
      onError: (err) => handleErr(err, "Không reset được"),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Thao tác user" className="h-8 w-8">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isSelf} onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" aria-hidden="true" />
            Sửa user
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isSelf} onSelect={onReset}>
            <KeyRound className="mr-2 size-4" aria-hidden="true" />
            Reset mật khẩu
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {disabled ? (
            <DropdownMenuItem onSelect={onUnarchive}>
              <RotateCcw className="mr-2 size-4" aria-hidden="true" />
              Enable user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isSelf}
              onSelect={onArchive}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Ban className="mr-2 size-4" aria-hidden="true" />
              Disable user
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} />
      <TempPasswordModal
        open={reveal !== null}
        onOpenChange={(o) => !o && setReveal(null)}
        email={reveal?.email ?? ""}
        tempPassword={reveal?.tempPassword ?? ""}
        title="Mật khẩu mới"
      />
    </>
  );
}
