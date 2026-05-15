import { ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectSummary } from "@onboarding/shared";
import { ProjectAvatar } from "@/components/common/ProjectAvatar";
import { ProgressBar } from "@/components/common/ProgressBar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { type PatternTone, toneColor } from "@/components/patterns/tone";
import { useMe } from "@/queries/auth";

interface ProjectCardProps {
  project: ProjectSummary;
}

const ACCENT_TONES: PatternTone[] = ["primary", "blue", "green", "purple", "pink", "cyan", "amber"];

// Deterministic slug → accent tone bucket (CR-005 §ProjectCard accent identity).
function accentFromSlug(slug: string): PatternTone {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return ACCENT_TONES[hash % ACCENT_TONES.length] as PatternTone;
}

const TONE_PILL: Record<PatternTone, string> = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-accent-blue-bg text-accent-blue",
  green: "bg-accent-green-bg text-accent-green",
  purple: "bg-accent-purple-bg text-accent-purple",
  pink: "bg-accent-pink-bg text-accent-pink",
  cyan: "bg-accent-cyan-bg text-accent-cyan",
  amber: "bg-accent-amber-bg text-accent-amber",
};

/**
 * Catalog grid card per home.md UI spec v3 iteration (CR-005 pilot v2).
 * v1 placeholders: filledSectionCount derived as 0 (BE extension deferred).
 */
export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  const { data: me } = useMe();
  const isAdmin = me?.user.role === "admin";

  const totalSections = project.featureCount * 5;
  const filledSections = 0;
  const pct = totalSections > 0 ? Math.round((filledSections / totalSections) * 100) : 0;

  const accent = accentFromSlug(project.slug);

  return (
    <Link
      to={`/projects/${project.slug}`}
      aria-label={`Xem chi tiết project ${project.name}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 pt-6 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden="true"
        style={{ backgroundColor: toneColor(accent) }}
        className="absolute inset-x-0 top-0 h-1.5"
      />
      {isAdmin ? (
        <div
          className="absolute right-2 top-3 z-10"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ProjectActionsMenu project={project} />
        </div>
      ) : null}
      <div className="flex items-start gap-3.5">
        <ProjectAvatar
          seed={project.slug}
          name={project.name}
          size={44}
          letters={2}
          accent={accent}
        />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 font-display text-[15px] leading-[22px] font-bold text-foreground">
            {project.name}
          </h2>
          {project.description ? (
            <p className="mt-1 line-clamp-1 font-body text-[13px] leading-[18px] text-muted-foreground">
              {project.description}
            </p>
          ) : null}
        </div>
        {isAdmin ? null : (
          <ChevronRight
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
          />
        )}
      </div>

      {totalSections > 0 ? (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-ui text-xs font-semibold text-foreground/80">
              {filledSections}/{totalSections} sections có nội dung
            </span>
            <span className="font-ui text-xs font-bold text-primary tabular-nums">{pct}%</span>
          </div>
          <ProgressBar value={pct} ariaLabel={`Sections progress ${pct}%`} />
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE_PILL[accent]}`}
        >
          <Users aria-hidden="true" className="size-3" />
          {project.featureCount} feature{project.featureCount === 1 ? "" : "s"}
        </span>
        <RelativeTime iso={project.updatedAt} className="text-xs" />
      </div>
    </Link>
  );
}
