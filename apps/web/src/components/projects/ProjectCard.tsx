import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectSummary } from "@onboarding/shared";
import { ProjectAvatar } from "@/components/common/ProjectAvatar";
import { ProgressBar } from "@/components/common/ProgressBar";
import { AvatarStack } from "@/components/common/AvatarStack";
import { RelativeTime } from "@/components/common/RelativeTime";

interface ProjectCardProps {
  project: ProjectSummary;
}

/**
 * Catalog grid card per home.md UI spec (CR-002 Phase 1B-1').
 * v1 placeholders: filledSectionCount derived as 0 (BE extension deferred);
 * AvatarStack contributors = hardcoded ["NL", "PT"] dummy supplements.
 */
export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  // v1 placeholder: BE doesn't return filledSectionCount yet. Compute total
  // sections (featureCount * 5) and show 0 filled until BE extension lands.
  const totalSections = project.featureCount * 5;
  const filledSections = 0; // placeholder
  const pct = totalSections > 0 ? Math.round((filledSections / totalSections) * 100) : 0;

  // v1 placeholder contributor list — supplemented hardcoded names.
  const contributors = ["NL", "PT"]; // TODO: derive from updatedByName once exposed

  return (
    <Link
      to={`/projects/${project.slug}`}
      aria-label={`Xem chi tiết project ${project.name}`}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top row: avatar + title/desc + chevron */}
      <div className="flex items-start gap-3.5">
        <ProjectAvatar seed={project.slug} name={project.name} size={44} letters={2} />
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
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      {/* Progress block */}
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

      {/* Footer: contributors + meta */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <AvatarStack names={contributors} size="sm" />
          <span className="font-ui text-xs font-medium text-muted-foreground">
            {project.featureCount} feature
          </span>
        </div>
        <RelativeTime iso={project.updatedAt} className="text-xs" />
      </div>
    </Link>
  );
}
