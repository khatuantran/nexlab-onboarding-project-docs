import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import type { ProjectSummary } from "@onboarding/shared";
import { AvatarStack } from "@/components/common/AvatarStack";
import { RelativeTime } from "@/components/common/RelativeTime";
import { ProgressRing } from "@/components/patterns/ProgressRing";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { useMe } from "@/queries/auth";

interface ProjectCardProps {
  project: ProjectSummary;
}

const TONE_KEYS = ["orange", "purple", "green", "blue", "rose", "amber"] as const;
type Tone = (typeof TONE_KEYS)[number];

/**
 * Header gradient classes for each of the 6 tones. Tailwind needs full
 * class names at build time, so we list them statically rather than
 * interpolating. `orange` maps to the existing `primary` brand ramp.
 */
const TONE_GRADIENT: Record<Tone, string> = {
  orange: "bg-gradient-to-br from-primary-700 to-primary",
  purple: "bg-gradient-to-br from-purple-700 to-purple-500",
  green: "bg-gradient-to-br from-green-700 to-green-500",
  blue: "bg-gradient-to-br from-blue-700 to-blue-500",
  rose: "bg-gradient-to-br from-rose-700 to-rose-500",
  amber: "bg-gradient-to-br from-amber-700 to-amber-500",
};

const CATEGORY_LABEL: Record<Tone, string> = {
  orange: "E2E",
  purple: "Backend",
  green: "Search",
  blue: "Payment",
  rose: "CRM",
  amber: "Admin",
};

const CONTRIBUTOR_POOL = ["EK", "PT", "KT", "NL", "TR", "TM"];

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function toneFromSlug(slug: string): { tone: Tone; category: string; pct: number } {
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

function getInitials(name: string): string {
  const word = name.trim().split(/\s+/)[0] ?? name;
  return word.slice(0, 2).toUpperCase();
}

/**
 * Catalog grid card per home.md §v4. Vivid gradient header (1 of 6
 * palettes by slug hash) + 2 decorative circles + initials plate + tag
 * pill + Live pill or admin overflow + ProgressRing. Body p-5 light:
 * title + 1-line desc + section dots + bottom row (AvatarStack +
 * features count + activity dot/clock + relative time).
 *
 * Replaces v3.1 muted full-color tile + CircleDecor primitive.
 */
export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  const { data: me } = useMe();
  const isAdmin = me?.user.role === "admin";

  const { tone, category, pct } = toneFromSlug(project.slug);
  const totalSections = Math.max(project.featureCount * 5, 5);
  const filledSections = Math.round((totalSections * pct) / 100);
  const contributors = pickContributors(project.slug);
  const isLive = project.featureCount > 0;
  const initials = getInitials(project.name);

  return (
    <Link
      to={`/projects/${project.slug}`}
      aria-label={`Xem chi tiết dự án ${project.name}`}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Header — vivid gradient + decorative circles + initials + tag/Live + ProgressRing */}
      <div
        className={`relative min-h-[150px] overflow-hidden p-[22px_22px_18px] text-white ${TONE_GRADIENT[tone]}`}
      >
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-10 size-[140px] rounded-full bg-white/10"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-8 -left-5 size-[100px] rounded-full bg-white/[0.07]"
        />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-2.5">
            <span
              aria-hidden="true"
              className="inline-flex size-[46px] items-center justify-center rounded-xl bg-white/[0.22] font-display text-[17px] font-extrabold text-white shadow"
            >
              {initials}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-white/30 bg-white/[0.22] px-2.5 py-1 font-ui text-[11px] font-bold uppercase tracking-wide text-white">
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
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.18] px-2.5 py-1 font-ui text-[11px] font-bold uppercase tracking-wide text-white">
                  <span
                    aria-hidden="true"
                    className="size-1.5 animate-pulse rounded-full bg-white"
                  />
                  Live
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <ProgressRing
              pct={pct}
              size={52}
              color="rgba(255,255,255,0.9)"
              bg="rgba(255,255,255,0.2)"
            />
            <span className="font-ui text-[10px] font-semibold text-white/70">doc</span>
          </div>
        </div>
      </div>

      {/* Body — light bg, title + desc + section dots + bottom row */}
      <div className="flex flex-1 flex-col gap-2.5 p-[16px_22px_20px]">
        <div>
          <h3 className="line-clamp-1 font-display text-[15px]/[20px] font-bold text-foreground">
            {project.name}
          </h3>
          {project.description ? (
            <p className="mt-1.5 line-clamp-1 font-body text-[12px]/[17px] text-muted-foreground">
              {project.description}
            </p>
          ) : null}
        </div>

        {/* Section dots row */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSections }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-[5px] flex-1 rounded-full transition-colors ${
                i < filledSections ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
          <span className="ml-2 font-ui text-[12px] font-bold text-foreground/80">
            {filledSections}/{totalSections}
          </span>
        </div>

        {/* Bottom row */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5 font-ui text-[12px]">
          <div className="flex items-center gap-2.5">
            <AvatarStack names={contributors} size="xs" />
            <span className="font-semibold text-muted-foreground">{project.featureCount}f</span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              isLive ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {isLive ? (
              <span
                aria-hidden="true"
                className="size-1.5 animate-pulse rounded-full bg-green-500"
              />
            ) : (
              <Clock aria-hidden="true" className="size-3" />
            )}
            <RelativeTime iso={project.updatedAt} showIcon={false} className="!text-[12px]" />
          </span>
        </div>
      </div>
    </Link>
  );
}
