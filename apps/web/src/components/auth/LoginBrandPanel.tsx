import { BookOpen, Code2, ListChecks, Star, Workflow } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { GradientHero } from "@/components/patterns/GradientHero";

const FEATURE_CARDS = [
  { color: "purple-500", icon: BookOpen, label: "Nghiệp vụ", sub: "Business logic" },
  { color: "primary", icon: Workflow, label: "User flow", sub: "Luồng nghiệp vụ" },
  { color: "green-500", icon: ListChecks, label: "Business rules", sub: "Quy tắc" },
  { color: "blue-500", icon: Code2, label: "Tech notes", sub: "API & PR" },
] as const;

/**
 * Left brand panel of LoginPage v4 (CR-006 v4) — dark vivid GradientHero
 * wrapper with eyebrow logo + h1 gradient text + 2×2 feature grid +
 * testimonial card. xl-only (hidden on mobile/tablet). Form is on the
 * right.
 */
export function LoginBrandPanel(): JSX.Element {
  return (
    <GradientHero showWatermark gridOverlay className="relative hidden flex-[0_0_620px] xl:flex">
      <aside
        aria-label="Nexlab onboarding portal"
        className="relative flex h-full w-full flex-col gap-9 p-[52px_52px_48px]"
      >
        {/* Logo lockup */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-flex size-[38px] items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-amber-500 shadow-[0_6px_16px_rgba(240,118,19,0.6)]"
          >
            <Star className="size-5 text-white" />
          </span>
          <span className="font-display text-[20px] font-extrabold tracking-[-0.01em] text-white">
            Nexlab
          </span>
          <span className="ml-1 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">
            Portal
          </span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="font-display text-[54px] font-black leading-[58px] tracking-[-0.03em] text-white">
            Onboard
            <br />
            <span className="bg-gradient-to-r from-[hsl(var(--logo-grad-start))] to-[hsl(var(--logo-grad-end))] bg-clip-text text-transparent">
              nhanh hơn.
            </span>
          </h1>
          <p className="mt-3.5 max-w-[380px] font-body text-[15px] leading-6 text-white/75">
            Một nơi duy nhất cho nghiệp vụ, flow, business rules, tech notes của mọi feature đang
            chạy.
          </p>
        </div>

        {/* Feature 2×2 grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURE_CARDS.map(({ color, icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-[12px] bg-white/[0.05] p-[14px_16px] backdrop-blur-md"
              style={{ borderColor: `hsl(var(--${color}) / 0.35)`, borderWidth: 1 }}
            >
              <span
                aria-hidden="true"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  background: `hsl(var(--${color}) / 0.25)`,
                  border: `1px solid hsl(var(--${color}) / 0.5)`,
                }}
              >
                <Icon className="size-[18px]" style={{ color: `hsl(var(--${color}))` }} />
              </span>
              <div>
                <div className="font-ui text-[13px] font-bold text-white">{label}</div>
                <div className="mt-1 font-ui text-[11px] font-medium text-white/75">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mt-auto flex items-center gap-3.5 rounded-[14px] border border-white/[0.12] bg-white/[0.06] p-[16px_18px]">
          <Avatar name="Ngọc Linh" size="md" />
          <div className="flex-1">
            <div className="mb-1.5 flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  aria-hidden="true"
                  className="size-3 fill-[#FFD092] stroke-[#FFD092]"
                />
              ))}
            </div>
            <p className="font-body text-[13px] italic leading-[18px] text-white/[0.88]">
              "Onboard 2 ngày thay vì cả tuần."
            </p>
            <div className="mt-1.5 font-ui text-[11px] font-semibold text-orange-100">
              Ngọc Linh · Senior Dev
            </div>
          </div>
        </div>
      </aside>
    </GradientHero>
  );
}
