import { Link } from "react-router-dom";
import type { ProjectSummary } from "@onboarding/shared";
import { AvatarStack } from "@/components/common/AvatarStack";
import { RelativeTime } from "@/components/common/RelativeTime";
import { CircleDecor } from "@/components/patterns/CircleDecor";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { useMe } from "@/queries/auth";

interface ProjectCardProps {
  project: ProjectSummary;
}

const TONE_KEYS = ["orange", "navy", "green", "amber", "peach", "rust"] as const;
type Tone = (typeof TONE_KEYS)[number];

const TONE_BG: Record<Tone, string> = {
  orange: "bg-tile-orange",
  navy: "bg-tile-navy",
  green: "bg-tile-green",
  amber: "bg-tile-amber",
  peach: "bg-tile-peach",
  rust: "bg-tile-rust",
};

const CATEGORY_LABEL: Record<Tone, string> = {
  orange: "E2E",
  navy: "Backend",
  green: "Search",
  amber: "Payment",
  peach: "CRM",
  rust: "Admin",
};

const CONTRIBUTOR_POOL = ["EK", "PT", "KT", "NL", "TR", "TM"];

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function tileFromSlug(slug: string): { tone: Tone; category: string; pct: number } {
  const h = hashSlug(slug);
  const tone = TONE_KEYS[h % TONE_KEYS.length]!;
  return {
    tone,
    category: CATEGORY_LABEL[tone],
    // Placeholder %: 0/20/40/60/80/100 cycle until BE filledSectionCount lands.
    pct: ((h >> 4) % 6) * 20,
  };
}

function pickContributors(slug: string, count = 3): string[] {
  const h = hashSlug(slug);
  const start = h % CONTRIBUTOR_POOL.length;
  return Array.from(
    { length: count },
    (_, i) => CONTRIBUTOR_POOL[(start + i) % CONTRIBUTOR_POOL.length]!,
  );
}

/**
 * Catalog grid card per home.md §v3.1 amendments (CR-006). Full-color
 * solid tile with category tag, big % display, decorative circles,
 * sections counter, avatar stack, and relative time. Replaces v3 banner-
 * top card per user mockup 2026-05-16.
 */
export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  const { data: me } = useMe();
  const isAdmin = me?.user.role === "admin";

  const { tone, category, pct } = tileFromSlug(project.slug);
  const totalSections = project.featureCount * 5;
  const filledSections = Math.round((totalSections * pct) / 100);
  const contributors = pickContributors(project.slug);
  const isLive = project.featureCount > 0;

  return (
    <Link
      to={`/projects/${project.slug}`}
      aria-label={`Xem chi tiết dự án ${project.name}`}
      className={`group relative flex h-[220px] flex-col overflow-hidden rounded-2xl p-5 text-white transition-all hover:scale-[1.01] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${TONE_BG[tone]}`}
    >
      <CircleDecor className="absolute -bottom-8 -right-8 h-48 w-48 text-white" opacity={0.18} />

      <div className="relative flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-md bg-white/15 px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {category}
        </span>
        {isAdmin ? (
          <div
            className="rounded-md bg-white/15 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ProjectActionsMenu project={project} />
          </div>
        ) : isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        ) : null}
      </div>

      <h3 className="relative mt-2 line-clamp-1 font-display text-[15px] font-semibold text-white">
        {project.name}
      </h3>

      <div className="relative mt-auto flex items-end gap-1">
        <span className="font-display text-[56px] font-bold leading-none tabular-nums text-white">
          {pct}%
        </span>
        <span className="mb-2 font-ui text-xs text-white/70">doc</span>
      </div>

      <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/20">
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2 font-ui text-[11px] text-white/85">
        <span>
          {filledSections}/{totalSections} sections · {project.featureCount} feature
          {project.featureCount === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-2">
          <AvatarStack names={contributors} size="xs" />
          <RelativeTime iso={project.updatedAt} className="!text-[11px] !text-white/85" />
        </span>
      </div>
    </Link>
  );
}
