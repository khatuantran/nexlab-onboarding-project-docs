import { ChevronRight, Clock, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectHit } from "@onboarding/shared";
import { ProjectAvatar } from "@/components/common/ProjectAvatar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { sanitizeSnippet } from "@/lib/sanitize";

export interface ProjectResultCardProps {
  hit: ProjectHit;
}

export function ProjectResultCard({ hit }: ProjectResultCardProps): JSX.Element {
  const sanitized = sanitizeSnippet(hit.snippet);
  return (
    <Link
      to={`/projects/${hit.slug}`}
      aria-label={`Project ${hit.name}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ProjectAvatar seed={hit.slug} name={hit.name} size={40} />
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-display text-lg font-semibold text-foreground">
          {hit.name}
        </h3>
        <p
          className="mt-1 line-clamp-1 font-body text-sm text-muted-foreground [&_mark]:rounded [&_mark]:bg-primary-100 [&_mark]:px-0.5 [&_mark]:text-primary-900 dark:[&_mark]:bg-primary-900/40 dark:[&_mark]:text-primary-100"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
        <div className="mt-2 flex items-center gap-3 font-ui text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FolderOpen className="size-3" aria-hidden="true" />
            {hit.featureCount} feature
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            <RelativeTime iso={hit.updatedAt} />
          </span>
        </div>
      </div>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </Link>
  );
}
