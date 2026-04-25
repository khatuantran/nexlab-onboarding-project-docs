import { ChevronRight, FileImage, Paperclip } from "lucide-react";
import { Link } from "react-router-dom";
import type { UploadHit } from "@onboarding/shared";
import { RelativeTime } from "@/components/common/RelativeTime";

export interface UploadResultCardProps {
  hit: UploadHit;
}

export function UploadResultCard({ hit }: UploadResultCardProps): JSX.Element {
  const isImage = hit.filename.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif|svg)$/) !== null;
  const Icon = isImage ? FileImage : Paperclip;
  return (
    <Link
      to={`/projects/${hit.projectSlug}/features/${hit.featureSlug}#section-screenshots`}
      aria-label={`File ${hit.filename}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden="true"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-mono text-sm text-foreground">{hit.filename}</p>
        {hit.caption ? (
          <p className="line-clamp-1 font-body text-xs text-muted-foreground">{hit.caption}</p>
        ) : null}
        <div className="mt-1 flex items-center gap-1.5 font-ui text-xs text-muted-foreground">
          <span className="truncate">{hit.projectSlug}</span>
          <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{hit.featureSlug}</span>
          <span aria-hidden="true">·</span>
          <RelativeTime iso={hit.createdAt} showIcon={false} />
        </div>
      </div>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </Link>
  );
}
