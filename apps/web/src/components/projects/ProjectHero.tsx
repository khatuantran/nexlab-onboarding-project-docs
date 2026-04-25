import type { ReactNode } from "react";
import { formatRelativeVi } from "@/lib/relativeTime";
import { DecorativeMark } from "@/components/common/DecorativeMark";
import { MiniStat } from "@/components/common/MiniStat";

interface ProjectHeroProps {
  name: string;
  description: string | null;
  featureCount: number;
  doneFeatureCount: number;
  totalSections: number;
  filledSections: number;
  lastUpdatedAt: string | null;
  lastUpdatedBy: string | null;
  actions?: ReactNode;
}

/**
 * Project landing hero panel per project-landing.md (CR-002 Phase 1B-2).
 * Gradient warm-orange backdrop + decorative NxLogo mark + 4 inline
 * mini-stats (Features / Sections progress / Đang chỉnh placeholder /
 * Cập nhật cuối). Hardcoded badges (Pilot / Đang chạy / Sprint 14) v1.
 */
export function ProjectHero({
  name,
  description,
  featureCount,
  doneFeatureCount,
  totalSections,
  filledSections,
  lastUpdatedAt,
  lastUpdatedBy,
  actions,
}: ProjectHeroProps): JSX.Element {
  const pct = totalSections > 0 ? Math.round((filledSections / totalSections) * 100) : 0;
  const updatedRel = lastUpdatedAt ? formatRelativeVi(lastUpdatedAt) : "—";

  return (
    <section className="relative mb-7 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-[#FFF8EE] via-[#FDEED7] to-[#FFE9D0] p-7 dark:border-primary-900/40 dark:from-primary-950/40 dark:via-primary-900/30 dark:to-primary-950/30">
      <DecorativeMark size={320} className="absolute -right-12 -top-12 hidden md:block" />

      <div className="relative">
        {/* Badges row */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-ui text-[11px] font-bold uppercase tracking-wide text-primary">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            Pilot
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 font-ui text-[11px] font-bold uppercase tracking-wide text-success">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-success animate-pulse" />
            Đang chạy
          </span>
          <span className="font-ui text-xs text-muted-foreground">· Sprint 14 · Catalog</span>
        </div>

        {/* h1 + subtitle */}
        <h1 className="font-display text-[32px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">
          {name}
        </h1>
        <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-foreground/80">
          {description ?? "Chưa có mô tả · BA và dev sẽ bổ sung context project."} BA:{" "}
          <strong>Trí Minh</strong> · Tech lead: <strong>Ngọc Linh</strong>.
        </p>

        {/* Mini-stats row */}
        <div className="mt-6 flex flex-wrap gap-7">
          <MiniStat label="FEATURES" value={featureCount} sub={`${doneFeatureCount} đã đủ doc`} />
          <MiniStat
            label="SECTIONS HOÀN THÀNH"
            value={`${filledSections}/${totalSections}`}
            sub={`${pct}% tổng tiến độ`}
            tone="primary"
          />
          <MiniStat label="ĐANG CHỈNH" value="—" sub="v2 — đang phát triển" />
          <MiniStat
            label="CẬP NHẬT CUỐI"
            value={updatedRel}
            sub={lastUpdatedBy ? `· @${lastUpdatedBy}` : "· chưa có hoạt động"}
          />
        </div>

        {/* Actions */}
        {actions ? <div className="mt-7 flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
