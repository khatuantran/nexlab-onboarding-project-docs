import { useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Flag,
  Home,
  Layers,
  Lock,
  Plus,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useMe } from "@/queries/auth";
import { GradientHero } from "@/components/patterns/GradientHero";
import { cn } from "@/lib/cn";

type CategoryId = "general" | "perms" | "notif" | "security" | "integr" | "theme";

interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  color: string; // hue prefix: "primary", "purple-500", etc.
  bg: string; // tinted bg class
}

const CATEGORIES: Category[] = [
  { id: "general", label: "Tổng quát", icon: Home, color: "primary", bg: "bg-primary-50" },
  { id: "perms", label: "Phân quyền", icon: Lock, color: "purple-500", bg: "bg-purple-50" },
  { id: "notif", label: "Thông báo", icon: Bell, color: "blue-500", bg: "bg-blue-50" },
  { id: "security", label: "Bảo mật", icon: Target, color: "rose-500", bg: "bg-rose-50" },
  { id: "integr", label: "Tích hợp", icon: Layers, color: "green-500", bg: "bg-green-50" },
  { id: "theme", label: "Giao diện", icon: Layers, color: "amber-500", bg: "bg-amber-50" },
];

function placeholder(label: string): () => void {
  return () => toast(`${label}: tính năng v2`);
}

function Toggle({
  defaultOn = false,
  label,
  sub,
}: {
  defaultOn?: boolean;
  label: string;
  sub?: string;
}): JSX.Element {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between border-b border-border py-3.5">
      <div>
        <div className="font-ui text-[14px] font-semibold text-foreground">{label}</div>
        {sub ? <div className="mt-1 font-body text-[12px] text-muted-foreground">{sub}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((p) => !p)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-all",
            on ? "left-[23px]" : "left-[3px]",
          )}
        />
      </button>
    </div>
  );
}

function Select({
  label,
  sub,
  value,
}: {
  label: string;
  sub?: string;
  value: string;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-border py-3.5">
      <div>
        <div className="font-ui text-[14px] font-semibold text-foreground">{label}</div>
        {sub ? <div className="mt-1 font-body text-[12px] text-muted-foreground">{sub}</div> : null}
      </div>
      <button
        type="button"
        onClick={placeholder(label)}
        className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-muted/40 px-3 py-2 font-ui text-[13px] font-semibold text-foreground hover:bg-muted"
      >
        {value}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>
    </div>
  );
}

function IntegrationCard({
  name,
  desc,
  color,
  connected,
}: {
  name: string;
  desc: string;
  color: string;
  connected: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-border bg-card p-[18px_20px]">
      <span
        aria-hidden="true"
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-[14px]"
        style={{ background: `${color}26`, border: `1px solid ${color}40` }}
      >
        <Layers className="size-[22px]" style={{ color }} />
      </span>
      <div className="flex-1">
        <div className="font-ui text-[15px] font-bold text-foreground">{name}</div>
        <div className="mt-1 font-body text-[12px] text-muted-foreground">{desc}</div>
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 font-ui text-[12px] font-semibold text-green-700">
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
          Đã kết nối
        </span>
      ) : (
        <button
          type="button"
          onClick={placeholder(`Kết nối ${name}`)}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 py-1.5 font-ui text-[12px] font-semibold text-foreground hover:bg-muted"
        >
          <Plus className="size-3" aria-hidden="true" />
          Kết nối
        </button>
      )}
    </div>
  );
}

const PANELS: Record<CategoryId, () => JSX.Element> = {
  general: () => (
    <div>
      <Toggle defaultOn label="Cho phép đăng ký mới" sub="Users mới có thể tự đăng ký tài khoản" />
      <Toggle
        label="Yêu cầu phê duyệt tài khoản"
        sub="Admin cần approve trước khi user truy cập được"
      />
      <Toggle
        defaultOn
        label="Bật trang Welcome"
        sub="Hiển thị trang giới thiệu khi user lần đầu đăng nhập"
      />
      <Select label="Ngôn ngữ mặc định" sub="Ngôn ngữ giao diện toàn hệ thống" value="Tiếng Việt" />
      <Select label="Múi giờ" sub="Dùng cho timestamp" value="GMT+7 (HCM)" />
      <Select label="Định dạng ngày" sub="Cách hiển thị ngày tháng" value="DD/MM/YYYY" />
    </div>
  ),
  perms: () => (
    <div>
      {[
        {
          role: "Admin",
          c: "#F43F5E",
          bg: "#FEE2E2",
          perms: ["Toàn quyền", "Quản lý user", "Cài đặt"],
        },
        {
          role: "PM",
          c: "#8B5CF6",
          bg: "#F3E8FF",
          perms: ["Xem tất cả", "Tạo project", "Export báo cáo"],
        },
        {
          role: "BA",
          c: "#F07613",
          bg: "#FFF7ED",
          perms: ["Tạo feature", "Chỉnh sửa doc", "Thêm sections"],
        },
        {
          role: "Dev",
          c: "#3B82F6",
          bg: "#EFF6FF",
          perms: ["Chỉnh Tech notes", "Xem Business rules"],
        },
        { role: "QA", c: "#10B981", bg: "#ECFDF5", perms: ["Thêm screenshots", "Comment"] },
      ].map((r) => (
        <div key={r.role} className="flex items-center gap-4 border-b border-border py-3.5">
          <span
            className="inline-flex min-w-[70px] justify-center rounded-md px-3 py-1 font-ui text-[13px] font-bold"
            style={{ background: r.bg, color: r.c }}
          >
            {r.role}
          </span>
          <div className="flex flex-1 flex-wrap gap-2">
            {r.perms.map((p) => (
              <span
                key={p}
                className="rounded-md border border-border bg-muted/40 px-2.5 py-1 font-ui text-[12px] font-medium text-foreground/80"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  notif: () => (
    <div>
      <Toggle defaultOn label="Email thông báo" sub="Gửi email khi có cập nhật quan trọng" />
      <Toggle defaultOn label="Thông báo in-app" sub="Hiển thị popup thông báo trong giao diện" />
      <Toggle label="Slack webhook" sub="Gửi thông báo vào kênh Slack" />
      <Toggle defaultOn label="Nhắc nhở deadline" sub="Nhắc 24h trước khi feature đến hạn" />
      <Toggle label="Digest hàng tuần" sub="Tổng kết hoạt động gửi mỗi sáng thứ Hai" />
    </div>
  ),
  security: () => (
    <div>
      <Toggle defaultOn label="Xác thực 2 bước (2FA)" sub="Bắt buộc với tất cả tài khoản Admin" />
      <Toggle label="Single Sign-On (SSO)" sub="Đăng nhập qua Google Workspace / LDAP" />
      <Select
        label="Session timeout"
        sub="Tự động đăng xuất sau thời gian không hoạt động"
        value="8 giờ"
      />
      <Select label="Password policy" sub="Yêu cầu độ phức tạp của mật khẩu" value="Mạnh" />
      <Toggle defaultOn label="Ghi log đăng nhập" sub="Lưu lịch sử đăng nhập của tất cả user" />
    </div>
  ),
  integr: () => (
    <div className="flex flex-col gap-3">
      <IntegrationCard
        name="GitHub"
        desc="Liên kết PR và commit với features"
        color="#24292F"
        connected
      />
      <IntegrationCard
        name="Jira"
        desc="Đồng bộ ticket và sprint từ Jira"
        color="#0052CC"
        connected
      />
      <IntegrationCard
        name="Slack"
        desc="Nhận thông báo qua kênh Slack"
        color="#4A154B"
        connected={false}
      />
      <IntegrationCard
        name="Google SSO"
        desc="Đăng nhập qua Google Workspace"
        color="#EA4335"
        connected={false}
      />
    </div>
  ),
  theme: () => (
    <div>
      <div className="border-b border-border pb-4">
        <div className="mb-3 font-ui text-[14px] font-semibold text-foreground">Màu chủ đạo</div>
        <div className="flex gap-3">
          {[
            { c: "#F07613", l: "Orange", active: true },
            { c: "#8B5CF6", l: "Purple", active: false },
            { c: "#3B82F6", l: "Blue", active: false },
            { c: "#10B981", l: "Green", active: false },
            { c: "#F43F5E", l: "Rose", active: false },
          ].map((p) => (
            <div key={p.c} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={placeholder(`Đổi màu ${p.l}`)}
                className="size-10 rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  background: p.c,
                  boxShadow: p.active
                    ? `0 0 0 3px hsl(var(--background)), 0 0 0 5px ${p.c}`
                    : "none",
                }}
                aria-label={`Đổi sang màu ${p.l}`}
              />
              <span className="font-ui text-[11px] font-medium text-muted-foreground">{p.l}</span>
            </div>
          ))}
        </div>
      </div>
      <Select label="Font chữ" sub="Font sử dụng trong toàn bộ giao diện" value="Inter + Roboto" />
      <Select label="Mật độ giao diện" sub="Ảnh hưởng đến khoảng cách + kích thước" value="Vừa" />
      <Toggle defaultOn label="Animation & transitions" sub="Hiệu ứng chuyển động" />
    </div>
  ),
};

/**
 * `/admin/settings` — v4 NEW skeleton (CR-006 v4). All settings are
 * hardcoded visual placeholders; toggles + selects don't persist. Admin
 * only.
 */
export function AdminSettingsPage(): JSX.Element {
  const { data: me, isLoading: meLoading } = useMe();
  const [activeCat, setActiveCat] = useState<CategoryId>("general");

  if (meLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8" aria-busy>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </main>
    );
  }
  if (me?.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const cat = CATEGORIES.find((c) => c.id === activeCat)!;
  const Panel = PANELS[activeCat];

  return (
    <main className="bg-background pb-16">
      {/* Dark vivid hero */}
      <GradientHero
        showWatermark
        gridOverlay
        className="px-10 pb-12 pt-9"
        blobs={[
          { color: "rgba(245,158,11,0.4)", size: 300, pos: { top: -50, left: -30 } },
          { color: "rgba(139,92,246,0.35)", size: 260, pos: { bottom: -30, right: 100 } },
        ]}
      >
        <span className="mb-3 inline-flex items-center rounded-full border border-amber-500/55 bg-amber-500/35 px-3.5 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100">
          ⚙ Quản trị
        </span>
        <h1 className="font-display text-[40px] font-black leading-[44px] tracking-[-0.03em] text-white sm:text-[48px] sm:leading-[52px]">
          Cài đặt
          <br />
          <span className="bg-gradient-to-r from-amber-500 to-amber-200 bg-clip-text text-transparent">
            hệ thống
          </span>
        </h1>
      </GradientHero>

      <div className="grid grid-cols-1 gap-6 px-10 pt-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar nav + danger zone */}
        <aside className="sticky top-20 self-start">
          <nav aria-label="Categories" className="rounded-2xl border border-border bg-card p-1.5">
            {CATEGORIES.map((c) => {
              const isAct = activeCat === c.id;
              const ColorRing = `hsl(var(--${c.color}))`;
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                    isAct ? c.bg : "bg-transparent hover:bg-muted/40",
                  )}
                  style={isAct ? { outline: `1.5px solid ${ColorRing}33` } : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-9 items-center justify-center rounded-[10px] border"
                    style={
                      isAct
                        ? {
                            background: `${ColorRing}38`,
                            borderColor: `${ColorRing}55`,
                          }
                        : {
                            background: "hsl(var(--muted))",
                            borderColor: "hsl(var(--border))",
                          }
                    }
                  >
                    <Icon
                      className="size-[17px]"
                      style={{ color: isAct ? ColorRing : "hsl(var(--muted-foreground))" }}
                    />
                  </span>
                  <span
                    className="flex-1 font-ui text-[14px] font-bold"
                    style={{ color: isAct ? ColorRing : "hsl(var(--foreground))" }}
                  >
                    {c.label}
                  </span>
                  {isAct ? (
                    <ChevronRight
                      className="size-3.5"
                      style={{ color: ColorRing }}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Danger zone */}
          <div className="mt-3.5 rounded-[14px] border border-rose-200 bg-rose-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Flag className="size-3.5 text-rose-500" aria-hidden="true" />
              <span className="font-ui text-[13px] font-bold text-rose-700">Danger zone</span>
            </div>
            <p className="mb-2.5 font-body text-[12px] leading-[18px] text-rose-700/85">
              Các thao tác không thể hoàn tác. Hãy cẩn thận.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Xóa toàn bộ dữ liệu là KHÔNG THỂ HOÀN TÁC. Tiếp tục?")) {
                  toast.error("Xóa toàn bộ dữ liệu: chặn placeholder, không thực thi v1");
                }
              }}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border-[1.5px] border-rose-500 bg-transparent font-ui text-[12px] font-semibold text-rose-500 hover:bg-rose-500 hover:text-white"
            >
              <X className="size-3" aria-hidden="true" />
              Xóa toàn bộ dữ liệu
            </button>
          </div>
        </aside>

        {/* Content panel */}
        <section
          aria-labelledby="settings-panel-title"
          className="overflow-hidden rounded-[18px] border border-border bg-card"
        >
          <header
            className={cn(
              "flex items-center justify-between gap-3 border-b border-border px-7 py-5",
              cat.bg,
            )}
          >
            <div className="flex items-center gap-3.5">
              <span
                aria-hidden="true"
                className="inline-flex size-11 items-center justify-center rounded-[12px] border"
                style={{
                  background: `hsl(var(--${cat.color}) / 0.22)`,
                  borderColor: `hsl(var(--${cat.color}) / 0.35)`,
                }}
              >
                <cat.icon className="size-[22px]" style={{ color: `hsl(var(--${cat.color}))` }} />
              </span>
              <div>
                <h2
                  id="settings-panel-title"
                  className="font-display text-[18px] font-extrabold text-foreground"
                >
                  {cat.label}
                </h2>
                <p className="mt-1 font-body text-[12px] text-muted-foreground">
                  Quản lý cài đặt {cat.label.toLowerCase()} của hệ thống
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={placeholder("Hủy thay đổi")}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-3.5 py-2 font-ui text-[13px] font-semibold text-foreground hover:bg-muted"
              >
                <X className="size-3.5" aria-hidden="true" />
                Hủy
              </button>
              <button
                type="button"
                onClick={placeholder("Lưu thay đổi")}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-primary to-primary-700 px-4 py-2 font-ui text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(226,99,20,0.4)]"
              >
                <Check className="size-3.5" aria-hidden="true" />
                Lưu thay đổi
              </button>
            </div>
          </header>
          <div className="px-7 py-2 pb-6">
            <Panel />
          </div>
        </section>
      </div>
    </main>
  );
}
