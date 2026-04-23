import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { SearchHit } from "@onboarding/shared";
import { sanitizeSnippet } from "@/lib/sanitize";

export interface SearchResultRowProps {
  hit: SearchHit;
}

export function SearchResultRow({ hit }: SearchResultRowProps): JSX.Element {
  const sanitized = sanitizeSnippet(hit.snippet);

  return (
    <Link
      to={`/projects/${hit.projectSlug}/features/${hit.featureSlug}`}
      aria-label={`${hit.title} — ${hit.projectSlug}`}
      className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{hit.projectSlug}</span>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span>{hit.featureSlug}</span>
      </div>
      <h3 className="mt-1 text-base font-medium text-foreground">{hit.title}</h3>
      <p
        className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground [&_mark]:rounded-sm [&_mark]:bg-highlight [&_mark]:px-0.5 [&_mark]:text-foreground"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </Link>
  );
}
