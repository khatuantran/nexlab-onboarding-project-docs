import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectSummary } from "@onboarding/shared";
import { RelativeTime } from "@/components/common/RelativeTime";

interface ProjectRowProps {
  project: ProjectSummary;
}

export function ProjectRow({ project }: ProjectRowProps): JSX.Element {
  return (
    <Link
      to={`/projects/${project.slug}`}
      aria-label={`Xem chi tiết project ${project.name}`}
      className="grid grid-cols-[1fr_auto] items-start gap-4 p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{project.name}</h2>
        {project.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        ) : (
          <p className="mt-1 text-sm italic text-muted-foreground">(chưa có mô tả)</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{project.featureCount} feature</span>
          <span aria-hidden="true">·</span>
          <RelativeTime iso={project.updatedAt} showIcon={false} />
        </div>
      </div>
      <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
    </Link>
  );
}
