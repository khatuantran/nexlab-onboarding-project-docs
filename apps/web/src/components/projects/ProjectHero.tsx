import type { ReactNode } from "react";
import { formatRelativeVi } from "@/lib/relativeTime";
import { AvatarStack } from "@/components/common/AvatarStack";
import { GradientHero } from "@/components/patterns/GradientHero";

interface ProjectHeroProps {
  name: string;
  description: string | null;
  featureCount: number;
  doneFeatureCount: number;
  totalSections: number;
  filledSections: number;
  lastUpdatedAt: string | null;
  lastUpdatedBy: string | null;
  /** US-011 — real contributor display names (top 5). Empty when no edits. */
  contributors: string[];
  actions?: ReactNode;
}

interface StatProps {
  value: string | number;
  label: string;
  color: string;
  live?: boolean;
}

function HeroStat({ value, label, color, live }: StatProps): JSX.Element {
  return (
    <div>
      <div
        className="inline-flex items-center gap-1.5 font-display text-[28px] font-black leading-none tracking-[-0.02em]"
        style={{ color }}
      >
        {live ? <span aria-hidden="true" className="live-dot size-1.5 rounded-full" /> : null}
        {value}
      </div>
      <div className="mt-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
        {label}
      </div>
    </div>
  );
}

/**
 * Project landing hero v4 (CR-006 v4) — dark vivid GradientHero with
 * compact tag/Live chip row + h1 + 4 colored inline stats + actions
 * row + AvatarStack. Replaces v2 warm gradient panel + MiniStat row.
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
  contributors,
  actions,
}: ProjectHeroProps): JSX.Element {
  const pct = totalSections > 0 ? Math.round((filledSections / totalSections) * 100) : 0;
  const updatedRel = lastUpdatedAt ? formatRelativeVi(lastUpdatedAt) : "—";
  void description;
  void lastUpdatedBy;

  return (
    <GradientHero
      showWatermark
      gridOverlay
      className="mx-10 mb-7 mt-3 rounded-[22px]"
      blobs={[
        { color: "rgba(240,118,19,0.4)", size: 300, pos: { top: -50, left: -30 } },
        { color: "rgba(139,92,246,0.35)", size: 260, pos: { bottom: -40, right: 120 } },
      ]}
    >
      <div className="flex flex-col gap-6 p-[32px_36px_30px] sm:flex-row sm:items-start">
        <div className="flex-1">
          {/* Tag + Live chips */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/50 bg-primary/25 px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-[#FFD092]">
              Pilot
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/20 px-3 py-1 font-ui text-[11px] font-semibold text-green-200">
              <span
                aria-hidden="true"
                className="size-1.5 animate-pulse rounded-full bg-green-300"
              />
              Đang chạy · Sprint 14
            </span>
          </div>

          <h1 className="font-display text-[32px] font-black leading-[38px] tracking-[-0.025em] text-white sm:text-[38px] sm:leading-[44px]">
            {name}
          </h1>

          {/* 4 inline stats */}
          <div className="mt-5 flex flex-wrap gap-8">
            <HeroStat value={featureCount} label="Features" color="#FFD092" />
            <HeroStat
              value={`${doneFeatureCount}/${featureCount}`}
              label="Đủ doc"
              color="#6EE7B7"
            />
            <HeroStat value={pct + "%"} label="Tiến độ" color="#93C5FD" live />
            <HeroStat value={updatedRel} label="Cập nhật" color="#C4B5FD" />
          </div>
        </div>

        {/* Actions cluster */}
        <div className="flex flex-col items-end gap-3">
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          <AvatarStack names={contributors} size="sm" />
        </div>
      </div>
    </GradientHero>
  );
}
