import { ChevronRight, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import type { SearchHit } from "@onboarding/shared";
import { sanitizeSnippet } from "@/lib/sanitize";

export interface SearchResultRowProps {
  hit: SearchHit;
}

/**
 * Search result card per search.md spec (CR-002 Phase 1B-4).
 * Project icon plate + title + breadcrumb context + 3-line sanitized
 * snippet với `<mark>` highlighting + chevron. v1 uses projectSlug as
 * project name fallback (BE schema extension deferred).
 */
export function SearchResultRow({ hit }: SearchResultRowProps): JSX.Element {
  const sanitized = sanitizeSnippet(hit.snippet);

  return (
    <Link
      to={`/projects/${hit.projectSlug}/features/${hit.featureSlug}`}
      aria-label={`${hit.title} — ${hit.projectSlug}`}
      className="group flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <FolderOpen className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 font-display text-lg leading-tight font-bold text-foreground">
            {hit.title}
          </h2>
          <div className="mt-1 flex items-center gap-1.5 font-ui text-xs text-muted-foreground">
            <span className="truncate">{hit.projectSlug}</span>
            <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{hit.featureSlug}</span>
          </div>
        </div>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      <p
        className="line-clamp-3 font-body text-sm leading-relaxed text-foreground/80 [&_mark]:rounded [&_mark]:bg-primary-100 [&_mark]:px-0.5 [&_mark]:text-primary-900 dark:[&_mark]:bg-primary-900/40 dark:[&_mark]:text-primary-100"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </Link>
  );
}
