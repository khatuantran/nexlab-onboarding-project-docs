import { useRef, useState, type FormEvent } from "react";
import { Bell, Camera, Clock, FolderOpen, Image as ImageIcon, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Avatar } from "@/components/common/Avatar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { GradientHero } from "@/components/patterns/GradientHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/queries/auth";
import { useChangePassword, useUpdateMyProfile, useUploadAvatar } from "@/queries/me";

/**
 * `/profile` — self-service profile page (US-009). Three section card:
 *   §1 Profile  — view 5 read-only field + inline edit displayName.
 *   §2 Security — change password (3-field form, validate match + len).
 *   §3 Avatar   — Cloudinary upload (PNG/JPG/WebP ≤ 2 MB).
 *
 * All mutations invalidate `authKeys.me` so the AppHeader avatar +
 * UserMenu trigger refresh without a manual reload.
 */
export function ProfilePage(): JSX.Element | null {
  const { data } = useMe();
  if (!data) return null;
  const user = data.user;

  return (
    <main className="bg-background pb-16">
      {/* Cover hero — v4 */}
      <GradientHero
        showWatermark
        gridOverlay
        className="relative h-[200px]"
        blobs={[
          { color: "rgba(139,92,246,0.5)", size: 320, pos: { top: -60, left: -40 } },
          { color: "rgba(240,118,19,0.45)", size: 280, pos: { bottom: -40, right: 120 } },
        ]}
      >
        <div className="relative h-full">
          <button
            type="button"
            onClick={() => toast("Đổi ảnh bìa: tính năng đang phát triển trong v2")}
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-[10px] border border-white/25 bg-white/12 px-3.5 py-1.5 font-ui text-[12px] font-semibold text-white backdrop-blur-sm hover:bg-white/15"
          >
            <ImageIcon className="size-3.5" aria-hidden="true" />
            Đổi ảnh bìa
          </button>
        </div>
      </GradientHero>

      {/* Profile card overlap */}
      <div className="relative -mt-[60px] px-10">
        <div className="flex flex-col gap-5 rounded-[20px] border border-border bg-card p-[24px_28px] shadow-lg sm:flex-row sm:items-end">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="rounded-[20px] border-4 border-background">
              <Avatar
                name={user.displayName}
                size="lg"
                imageUrl={user.avatarUrl}
                className="size-24 rounded-[16px] bg-gradient-to-br from-primary to-primary-700 text-[32px] shadow-[0_8px_24px_rgba(240,118,19,0.45)]"
              />
            </div>
            <span
              aria-hidden="true"
              className="absolute bottom-1 right-1 size-[18px] rounded-full border-[3px] border-card bg-green-500"
            />
          </div>

          {/* Name + meta */}
          <div className="flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
                Hồ sơ của tôi
              </h1>
              <span
                className={
                  "inline-flex items-center rounded-full px-3 py-1 font-ui text-[12px] font-bold " +
                  (user.role === "admin"
                    ? "bg-primary-50 text-primary-700"
                    : "bg-muted text-muted-foreground")
                }
              >
                {user.role === "admin" ? "Admin" : "Author"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-ui text-[12px] font-semibold text-green-700">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-green-500 ring-2 ring-green-500/30"
                />
                Online
              </span>
            </div>
            <div className="flex flex-wrap gap-5 font-body text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FolderOpen aria-hidden="true" className="size-3.5" />
                {user.displayName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5" />
                Joined{" "}
                <RelativeTime iso={user.createdAt} showIcon={false} className="!text-[13px]" />
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => toast("Thông báo: tính năng đang phát triển")}
              className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-background px-3.5 py-2 font-ui text-[13px] font-semibold text-foreground hover:bg-muted"
            >
              <Bell aria-hidden="true" className="size-3.5" />
              Thông báo
            </button>
          </div>
        </div>
      </div>

      {/* Three sections (compatibility with existing tests + functional form pieces) */}
      <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-6 px-10">
        <ProfileSection user={user} />
        <SecuritySection />
        <AvatarSection user={user} />
      </div>
    </main>
  );
}

function ProfileSection({ user }: { user: ProfileUser }): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user.displayName);
  const mutation = useUpdateMyProfile();

  const onSave = (e: FormEvent): void => {
    e.preventDefault();
    const next = draft.trim();
    if (!next || next === user.displayName) {
      setEditing(false);
      setDraft(user.displayName);
      return;
    }
    mutation.mutate(
      { displayName: next },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật hồ sơ");
          setEditing(false);
        },
        onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
      },
    );
  };

  return (
    <section
      aria-labelledby="profile-section-title"
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 id="profile-section-title" className="font-display text-lg font-semibold">
        Thông tin tài khoản
      </h2>
      <div className="mt-4 flex items-start gap-5">
        <Avatar name={user.displayName} size="lg" imageUrl={user.avatarUrl} />
        <dl className="flex-1 space-y-3 text-sm">
          <Field label="Email" value={user.email} />
          <div>
            <dt className="font-ui text-xs uppercase tracking-wide text-muted-foreground">
              Tên hiển thị
            </dt>
            <dd className="mt-1 flex items-center gap-2">
              {editing ? (
                <form className="flex flex-1 items-center gap-2" onSubmit={onSave}>
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label="Tên hiển thị"
                  />
                  <Button type="submit" size="sm" disabled={mutation.isPending}>
                    Lưu
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setDraft(user.displayName);
                    }}
                  >
                    Hủy
                  </Button>
                </form>
              ) : (
                <>
                  <span className="font-medium text-foreground">{user.displayName}</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
                    <Pencil className="mr-1 size-3.5" aria-hidden="true" />
                    Sửa
                  </Button>
                </>
              )}
            </dd>
          </div>
          <Field
            label="Vai trò"
            value={
              <span
                className={
                  "inline-flex items-center rounded-full px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide " +
                  (user.role === "admin"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground")
                }
              >
                {user.role === "admin" ? "Admin" : "Author"}
              </span>
            }
          />
          <Field
            label="Tham gia"
            value={<RelativeTime iso={user.createdAt} className="text-foreground" />}
          />
          <Field
            label="Lần login cuối"
            value={
              user.lastLoginAt ? (
                <RelativeTime iso={user.lastLoginAt} className="text-foreground" />
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
        </dl>
      </div>
    </section>
  );
}

function SecuritySection(): JSX.Element {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [oldErr, setOldErr] = useState<string | null>(null);
  const [newErr, setNewErr] = useState<string | null>(null);
  const mutation = useChangePassword();

  const reset = (): void => {
    setOld("");
    setNew("");
    setConfirm("");
    setOldErr(null);
    setNewErr(null);
  };

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setOldErr(null);
    setNewErr(null);
    if (newPassword.length < 8) {
      setNewErr("Mật khẩu mới tối thiểu 8 ký tự");
      return;
    }
    if (newPassword !== confirm) {
      setNewErr("Xác nhận mật khẩu không khớp");
      return;
    }
    mutation.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Đã đổi mật khẩu — các phiên khác đã đăng xuất");
          reset();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 401) {
            setOldErr("Mật khẩu cũ không đúng");
            return;
          }
          if (err instanceof ApiError && err.status === 400) {
            setNewErr("Mật khẩu mới không hợp lệ");
            return;
          }
          toast.error("Có lỗi xảy ra, thử lại sau");
        },
      },
    );
  };

  return (
    <section
      aria-labelledby="security-section-title"
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 id="security-section-title" className="font-display text-lg font-semibold">
        Đổi mật khẩu
      </h2>
      <p className="mt-1 font-body text-sm text-muted-foreground">
        Đổi mật khẩu xong, các phiên đăng nhập khác sẽ bị thoát.
      </p>
      <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="me-old">Mật khẩu hiện tại</Label>
          <Input
            id="me-old"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOld(e.target.value)}
            required
          />
          {oldErr ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {oldErr}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="me-new">Mật khẩu mới (≥ 8 ký tự)</Label>
          <Input
            id="me-new"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <Label htmlFor="me-confirm">Xác nhận mật khẩu mới</Label>
          <Input
            id="me-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {newErr ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {newErr}
            </p>
          ) : null}
        </div>
        <div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </section>
  );
}

function AvatarSection({ user }: { user: ProfileUser }): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useUploadAvatar();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File quá lớn (≤ 2 MB)");
      e.target.value = "";
      return;
    }
    mutation.mutate(file, {
      onSuccess: () => toast.success("Đã cập nhật ảnh đại diện"),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 415) {
          toast.error("File phải là ảnh PNG/JPG/WebP");
        } else if (err instanceof ApiError && err.status === 413) {
          toast.error("File quá lớn (≤ 2 MB)");
        } else if (err instanceof ApiError && (err.status === 502 || err.status === 503)) {
          toast.error("Upload tạm thời không khả dụng, thử lại sau");
        } else {
          toast.error("Có lỗi xảy ra, thử lại sau");
        }
      },
    });
    e.target.value = "";
  };

  return (
    <section
      aria-labelledby="avatar-section-title"
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 id="avatar-section-title" className="font-display text-lg font-semibold">
        Ảnh đại diện
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <Avatar name={user.displayName} size="lg" imageUrl={user.avatarUrl} />
        <div className="flex-1">
          <p className="font-body text-sm text-muted-foreground">
            PNG, JPG, hoặc WebP ≤ 2 MB. Ảnh hiển thị trên header và các pages có avatar.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPick}
              aria-label="Chọn ảnh đại diện"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="mr-2 size-4" aria-hidden="true" />
              )}
              Tải lên ảnh mới
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ProfileUser {
  displayName: string;
  email: string;
  role: "admin" | "author";
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

function Field({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <div>
      <dt className="font-ui text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
