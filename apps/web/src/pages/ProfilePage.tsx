import { useRef, useState, type FormEvent } from "react";
import {
  Activity as ActivityIcon,
  Camera,
  Check as CheckIcon,
  Clock,
  Edit as EditIcon,
  File as FileIcon,
  FolderOpen,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Star,
  User as UserIcon,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Avatar } from "@/components/common/Avatar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { GradientHero } from "@/components/patterns/GradientHero";
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
import { useMe } from "@/queries/auth";
import { useChangePassword, useUpdateMyProfile, useUploadAvatar } from "@/queries/me";
import { useMeStats, useMyActivity, useMyRecentProjects } from "@/queries/stats";
import { cn } from "@/lib/cn";
import { Link } from "react-router-dom";
import { formatRelativeVi } from "@/lib/relativeTime";

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
          {/* Avatar — clickable to open AvatarUploadDialog */}
          <AvatarUploadDialog user={user} />

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
                <Mail aria-hidden="true" className="size-3.5" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5" />
                Joined{" "}
                <RelativeTime iso={user.createdAt} showIcon={false} className="!text-[13px]" />
              </span>
            </div>
          </div>

          {/* Actions — 3 dialog triggers */}
          <div className="flex flex-wrap gap-2.5">
            <ChangePasswordDialog />
            <EditProfileDialog user={user} />
          </div>
        </div>
      </div>

      {/* Tabs row — purely decorative; content below renders always for test compat */}
      <ProfileTabs />

      {/* 2-col visual layout — v4 cards on top, existing form sections below */}
      <div className="grid grid-cols-1 gap-5 px-10 pt-6 lg:grid-cols-2">
        {/* LEFT column */}
        <div className="flex flex-col gap-4">
          <PersonalInfoCard user={user} />
          <SkillsCard />
        </div>
        {/* RIGHT column */}
        <div className="flex flex-col gap-4">
          <StatsCard />
          <RecentProjectsCard />
          <ActivityFeedCard />
        </div>
      </div>
    </main>
  );
}

const TABS = ["Thông tin", "Đóng góp", "Bảo mật"] as const;
type TabId = (typeof TABS)[number];

function ProfileTabs(): JSX.Element {
  const [active, setActive] = useState<TabId>("Thông tin");
  return (
    <div className="border-b border-border px-10 pt-1">
      <div role="tablist" aria-label="Tabs hồ sơ" className="flex flex-wrap gap-0">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={active === t}
            onClick={() => {
              setActive(t);
              if (t !== "Thông tin") toast(`${t}: nội dung placeholder, v2`);
            }}
            className={cn(
              "relative -mb-px px-5 py-3.5 font-ui text-[14px] font-semibold transition-colors",
              active === t
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Personal info — read-only summary card (v4 NEW) ---------- */

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: string | null;
  accent: string;
}

function InfoRow({ icon: Icon, label, value, accent }: InfoRowProps): JSX.Element {
  const isEmpty = value == null || value.trim().length === 0;
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <span
        aria-hidden="true"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${accent}26` }}
      >
        <Icon className="size-[15px]" style={{ color: accent }} />
      </span>
      <div className="flex-1">
        <div className="font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </div>
        <div
          className={
            isEmpty
              ? "mt-1 font-ui text-[14px] italic text-muted-foreground"
              : "mt-1 font-ui text-[14px] font-semibold text-foreground"
          }
        >
          {isEmpty ? "— Chưa cập nhật" : value}
        </div>
      </div>
    </div>
  );
}

function PersonalInfoCard({ user }: { user: ProfileUser }): JSX.Element {
  return (
    <section
      aria-labelledby="personal-info-title"
      className="rounded-2xl border border-border bg-card p-[20px_24px]"
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-display text-[15px] font-bold text-foreground">
          <span
            aria-hidden="true"
            className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-50"
          >
            <UserIcon className="size-3.5 text-primary-700" />
          </span>
          <h3 id="personal-info-title">Thông tin cá nhân</h3>
        </span>
      </div>
      <InfoRow icon={UserIcon} label="Họ tên" value={user.displayName} accent="#F07613" />
      <InfoRow icon={Phone} label="Điện thoại" value={user.phone} accent="#10B981" />
      <InfoRow icon={UsersIcon} label="Phòng ban" value={user.department} accent="#8B5CF6" />
      <InfoRow icon={MapPin} label="Địa chỉ" value={user.location} accent="#F43F5E" />
    </section>
  );
}

/* ---------- Skills card ---------- */

const SKILLS = [
  { t: "Business Analysis", c: "#F07613" },
  { t: "User Story", c: "#8B5CF6" },
  { t: "Figma", c: "#F43F5E" },
  { t: "SQL", c: "#3B82F6" },
  { t: "BPMN", c: "#10B981" },
  { t: "Product Thinking", c: "#F59E0B" },
  { t: "Onboarding Doc", c: "#F07613" },
];

function SkillsCard(): JSX.Element {
  return (
    <section
      aria-labelledby="skills-title"
      className="rounded-2xl border border-border bg-card p-[20px_24px]"
    >
      <span className="mb-3.5 inline-flex items-center gap-2 font-display text-[15px] font-bold text-foreground">
        <span
          aria-hidden="true"
          className="inline-flex size-7 items-center justify-center rounded-lg bg-purple-50"
        >
          <Star className="size-3.5 text-purple-700" />
        </span>
        <h3 id="skills-title">Kỹ năng & Tags</h3>
      </span>
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <span
            key={s.t}
            className="rounded-full border px-3 py-1 font-ui text-[12px] font-semibold"
            style={{ background: `${s.c}1F`, borderColor: `${s.c}4D`, color: s.c }}
          >
            {s.t}
          </span>
        ))}
        <button
          type="button"
          onClick={() => toast("Thêm skill: tính năng v2")}
          className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-border bg-transparent px-3 py-1 font-ui text-[12px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
        >
          <Plus className="size-3" aria-hidden="true" />
          Thêm
        </button>
      </div>
    </section>
  );
}

/* ---------- Stats 4-tile card ---------- */

const STATS_META = [
  { key: "projectsTouched", icon: FolderOpen, l: "Projects", c: "#F07613" },
  { key: "featuresDocumented", icon: FileIcon, l: "Features doc", c: "#8B5CF6" },
  { key: "totalEdits", icon: EditIcon, l: "Lần chỉnh sửa", c: "#3B82F6" },
  { key: "sectionsCompleted", icon: CheckIcon, l: "Sections xong", c: "#10B981" },
] as const;

function StatsCard(): JSX.Element {
  const { data: stats } = useMeStats();
  return (
    <section
      aria-labelledby="stats-title"
      className="rounded-2xl border border-border bg-card p-[20px_24px]"
    >
      <span className="mb-4 inline-flex items-center gap-2 font-display text-[15px] font-bold text-foreground">
        <span
          aria-hidden="true"
          className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50"
        >
          <ActivityIcon className="size-3.5 text-blue-700" />
        </span>
        <h3 id="stats-title">Thống kê đóng góp</h3>
      </span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS_META.map((s) => {
          const v = stats ? stats[s.key] : null;
          return (
            <div
              key={s.l}
              className="rounded-xl border p-[14px_12px] text-center"
              style={{ background: `${s.c}1A`, borderColor: `${s.c}40` }}
            >
              <span
                aria-hidden="true"
                className="mb-2 inline-flex size-8 items-center justify-center rounded-lg"
                style={{ background: `${s.c}33` }}
              >
                <s.icon className="size-4" style={{ color: s.c }} />
              </span>
              <div className="font-display text-[22px] font-black tracking-[-0.02em] text-foreground">
                {v === null ? "—" : v}
              </div>
              <div className="mt-1.5 font-ui text-[11px]/[1.3] font-semibold text-muted-foreground">
                {s.l}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Recent projects card ---------- */

const RECENT_PALETTE = ["#F07613", "#8B5CF6", "#10B981", "#3B82F6"] as const;

function RecentProjectsCard(): JSX.Element {
  const { data, isLoading } = useMyRecentProjects(4);
  const rows = data ?? [];
  return (
    <section
      aria-labelledby="recent-projects-title"
      className="rounded-2xl border border-border bg-card p-[20px_24px]"
    >
      <span className="mb-3.5 inline-flex items-center gap-2 font-display text-[15px] font-bold text-foreground">
        <span
          aria-hidden="true"
          className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-50"
        >
          <FolderOpen className="size-3.5 text-primary-700" />
        </span>
        <h3 id="recent-projects-title">Projects tham gia</h3>
      </span>
      {!isLoading && rows.length === 0 ? (
        <p className="font-body text-xs italic text-muted-foreground">
          Chưa có dự án nào — bắt đầu chỉnh sửa để xuất hiện ở đây.
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map((p, i) => {
            const c = RECENT_PALETTE[i % RECENT_PALETTE.length]!;
            return (
              <div
                key={p.slug}
                className={cn(
                  "flex items-center gap-3 py-2.5",
                  i < rows.length - 1 && "border-b border-border",
                )}
              >
                <Link
                  to={`/projects/${p.slug}`}
                  aria-label={`Mở dự án ${p.name}`}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: `${c}26` }}
                >
                  <FolderOpen className="size-4" style={{ color: c }} aria-hidden="true" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/projects/${p.slug}`}
                    className="truncate font-ui text-[13px] font-semibold text-foreground hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-1 font-ui text-[11px] text-muted-foreground">
                    Chỉnh sửa {formatRelativeVi(p.lastTouchedAt)}
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 font-ui text-[11px] font-bold"
                  style={{ background: `${c}1F`, color: c }}
                  title="Số section bạn đã chỉnh sửa trong project này"
                >
                  {p.sectionsTouched} sect.
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------- Activity feed card ---------- */

const SECTION_LABEL_VI: Record<string, string> = {
  business: "Nghiệp vụ",
  "user-flow": "User flow",
  "business-rules": "Business rules",
  "tech-notes": "Tech notes",
  screenshots: "Screenshots",
};

function ActivityFeedCard(): JSX.Element {
  const { data, isLoading } = useMyActivity(20);
  const items = data?.items ?? [];
  return (
    <section
      aria-labelledby="activity-title"
      className="rounded-2xl border border-border bg-card p-[20px_24px]"
    >
      <span className="mb-3.5 inline-flex items-center gap-2 font-display text-[15px] font-bold text-foreground">
        <span
          aria-hidden="true"
          className="inline-flex size-7 items-center justify-center rounded-lg bg-green-50"
        >
          <Clock className="size-3.5 text-green-700" />
        </span>
        <h3 id="activity-title">Hoạt động gần đây</h3>
      </span>
      {!isLoading && items.length === 0 ? (
        <p className="font-body text-xs italic text-muted-foreground">
          Chưa có hoạt động — bắt đầu chỉnh sửa để xuất hiện ở đây.
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((a, i) => (
            <div
              key={a.id}
              className={cn(
                "flex gap-2.5 py-2.5",
                i < items.length - 1 && "border-b border-border",
              )}
            >
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-500"
              />
              <div className="flex-1">
                <span className="font-body text-[13px] leading-[18px] text-muted-foreground">
                  Cập nhật{" "}
                  <strong className="font-semibold text-foreground">
                    {SECTION_LABEL_VI[a.sectionType] ?? a.sectionType}
                  </strong>{" "}
                  ở{" "}
                  <Link
                    to={`/projects/${a.projectSlug}/features/${a.featureSlug}`}
                    className="font-semibold text-primary-700 hover:underline"
                  >
                    {a.featureTitle}
                  </Link>
                </span>
                <div className="mt-1 font-ui text-[11px] font-medium text-muted-foreground">
                  {formatRelativeVi(a.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Types ---------- */

interface ProfileUser {
  displayName: string;
  email: string;
  role: "admin" | "author";
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  // US-010 — profile enrichment, all nullable.
  phone: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
}

/* ---------- EditProfileDialog ---------- */

interface ProfileFormDraft {
  displayName: string;
  phone: string;
  department: string;
  location: string;
  bio: string;
}

function makeDraft(user: ProfileUser): ProfileFormDraft {
  return {
    displayName: user.displayName,
    phone: user.phone ?? "",
    department: user.department ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
  };
}

function EditProfileDialog({ user }: { user: ProfileUser }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileFormDraft>(() => makeDraft(user));
  const mutation = useUpdateMyProfile();

  /**
   * US-010 — diff against original. For each text field:
   *   - missing key in patch → leave untouched on server.
   *   - explicit `null` → clear (only if had a value and user emptied it).
   *   - string → update.
   */
  const buildPatch = (): {
    displayName?: string;
    phone?: string | null;
    department?: string | null;
    location?: string | null;
    bio?: string | null;
  } => {
    const patch: ReturnType<typeof buildPatch> = {};
    const nextDisplay = draft.displayName.trim();
    if (nextDisplay && nextDisplay !== user.displayName) patch.displayName = nextDisplay;
    const diff = (key: "phone" | "department" | "location" | "bio") => {
      const original = user[key] ?? "";
      const next = draft[key].trim();
      if (next === original) return;
      patch[key] = next === "" ? null : next;
    };
    diff("phone");
    diff("department");
    diff("location");
    diff("bio");
    return patch;
  };

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      setOpen(false);
      return;
    }
    mutation.mutate(patch, {
      onSuccess: () => {
        toast.success("Đã cập nhật hồ sơ");
        setOpen(false);
      },
      onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(makeDraft(user));
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-primary to-primary-700 px-3.5 py-2 font-ui text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(226,99,20,0.4)] hover:from-primary-600"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Cập nhật hồ sơ
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-bold">
            Thông tin tài khoản
          </DialogTitle>
          <DialogDescription className="font-body text-[13px] text-muted-foreground">
            Cập nhật tên hiển thị, số điện thoại, phòng ban, địa chỉ và bio.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4 px-6 pb-4 pt-2" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-displayname" className="font-ui text-xs font-semibold">
              Tên hiển thị
            </Label>
            <Input
              id="edit-displayname"
              autoFocus
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              aria-label="Tên hiển thị"
            />
            <p className="font-ui text-[11px] text-muted-foreground">
              Email cố định: <strong className="text-foreground">{user.email}</strong>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-phone" className="font-ui text-xs font-semibold">
              Điện thoại
            </Label>
            <Input
              id="edit-phone"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder="0901 234 567"
              aria-label="Điện thoại"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-department" className="font-ui text-xs font-semibold">
              Phòng ban
            </Label>
            <Input
              id="edit-department"
              value={draft.department}
              onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              placeholder="vd. BA Team"
              aria-label="Phòng ban"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-location" className="font-ui text-xs font-semibold">
              Địa chỉ
            </Label>
            <Input
              id="edit-location"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="vd. TP. Hồ Chí Minh"
              aria-label="Địa chỉ"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-bio" className="font-ui text-xs font-semibold">
              Bio (tối đa 500 ký tự)
            </Label>
            <textarea
              id="edit-bio"
              value={draft.bio}
              maxLength={500}
              rows={3}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              aria-label="Bio"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-body text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- ChangePasswordDialog ---------- */

function ChangePasswordDialog(): JSX.Element {
  const [open, setOpen] = useState(false);
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
          setOpen(false);
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-background px-3.5 py-2 font-ui text-[13px] font-semibold text-foreground hover:bg-muted"
        >
          <KeyRound aria-hidden="true" className="size-3.5" />
          Đổi mật khẩu
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-bold">Đổi mật khẩu</DialogTitle>
          <DialogDescription className="font-body text-[13px] text-muted-foreground">
            Đổi mật khẩu xong, các phiên đăng nhập khác sẽ bị thoát.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 px-6 pb-4 pt-2" onSubmit={onSubmit}>
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
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Cập nhật mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- AvatarUploadDialog ---------- */

function AvatarUploadDialog({ user }: { user: ProfileUser }): JSX.Element {
  const [open, setOpen] = useState(false);
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
      onSuccess: () => {
        toast.success("Đã cập nhật ảnh đại diện");
        setOpen(false);
      },
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Đổi ảnh đại diện"
          className="group relative shrink-0 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
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
            className="absolute -bottom-1 -right-1 inline-flex size-7 items-center justify-center rounded-full border-[3px] border-card bg-primary shadow transition-transform group-hover:scale-110"
          >
            <Camera className="size-3.5 text-white" />
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden items-center justify-center rounded-[20px] bg-black/40 font-ui text-[11px] font-bold text-white group-hover:flex"
          >
            Đổi ảnh
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-bold">Ảnh đại diện</DialogTitle>
          <DialogDescription className="font-body text-[13px] text-muted-foreground">
            PNG, JPG, hoặc WebP ≤ 2 MB. Ảnh hiển thị trên header và các pages có avatar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 px-6 pb-4 pt-2">
          <Avatar
            name={user.displayName}
            size="lg"
            imageUrl={user.avatarUrl}
            className="size-32 rounded-[20px] bg-gradient-to-br from-primary to-primary-700 text-[44px]"
          />
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
            onClick={() => inputRef.current?.click()}
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="mr-2 size-4" aria-hidden="true" />
            )}
            Tải lên ảnh mới
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
