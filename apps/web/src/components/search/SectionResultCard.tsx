import { ChevronRight, FileImage, ListChecks, ScrollText, Workflow, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import type { SectionHit, SectionType } from "@onboarding/shared";
import { RelativeTime } from "@/components/common/RelativeTime";
import { sanitizeSnippet } from "@/lib/sanitize";

const SECTION_LABEL: Record<SectionType, string> = {
  business: "Business",
  "user-flow": "User flow",
  "business-rules": "Business rules",
  "tech-notes": "Tech notes",
  screenshots: "Screenshots",
};

const SECTION_ICON: Record<SectionType, typeof ScrollText> = {
  business: ScrollText,
  "user-flow": Workflow,
  "business-rules": ListChecks,
  "tech-notes": Wrench,
  screenshots: FileImage,
};

export interface SectionResultCardProps {
  hit: SectionHit;
}

export function SectionResultCard({ hit }: SectionResultCardProps): JSX.Element {
  const Icon = SECTION_ICON[hit.sectionType];
  const sanitized = sanitizeSnippet(hit.snippet);

  return (
    <Link
      to={`/projects/${hit.projectSlug}/features/${hit.featureSlug}#section-${hit.sectionType}`}
      aria-label={`${SECTION_LABEL[hit.sectionType]} trong ${hit.featureTitle}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300">
            {SECTION_LABEL[hit.sectionType]}
          </p>
          <h3 className="line-clamp-1 font-display text-base font-semibold text-foreground">
            {hit.featureTitle}
          </h3>
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

      <div className="flex items-center gap-2 border-t border-border pt-3 font-ui text-xs text-muted-foreground">
        <span>{hit.updatedByName ?? "—"}</span>
        <span aria-hidden="true">·</span>
        <RelativeTime iso={hit.updatedAt} showIcon={false} />
      </div>
    </Link>
  );
}
