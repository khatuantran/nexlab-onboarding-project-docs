import { ChevronRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import type { FeatureListItem } from "@onboarding/shared";
import { cn } from "@/lib/cn";
import { AvatarStack } from "@/components/common/AvatarStack";
import { ProgressBar } from "@/components/common/ProgressBar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { SectionDots } from "@/components/common/SectionDots";

interface FeatureCardProps {
  projectSlug: string;
  feature: FeatureListItem;
}

type Status = "done" | "active" | "draft";

const STATUS_LABEL: Record<Status, string> = {
  done: "Đủ doc",
  active: "Đang viết",
  draft: "Draft",
};

const STATUS_PLATE: Record<Status, string> = {
  done: "bg-success/10 text-success",
  active: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
};

const STATUS_BADGE: Record<Status, string> = {
  done: "bg-success/15 text-success",
  active: "bg-primary/15 text-primary",
  draft: "bg-muted text-muted-foreground",
};

function deriveStatus(filled: number): Status {
  if (filled >= 5) return "done";
  if (filled >= 1) return "active";
  return "draft";
}

/**
 * Project landing feature card per project-landing.md (CR-002 Phase 1B-2).
 * Icon plate (status-tinted) + title + status badge + RelativeTime +
 * progress block + footer (avatar stack + section dots).
 * Contributors hardcoded ["NL", "PT"] placeholder until BE exposes editors.
 */
export function FeatureCard({ projectSlug, feature }: FeatureCardProps): JSX.Element {
  const status = deriveStatus(feature.filledCount);
  const total = 5;
  const pct = Math.round((feature.filledCount / total) * 100);
  const contributors = ["NL", "PT"]; // v1 placeholder

  return (
    <Link
      to={`/projects/${projectSlug}/features/${feature.slug}`}
      className="group flex flex-col gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Xem chi tiết feature ${feature.title}`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-lg shrink-0",
            STATUS_PLATE[status],
          )}
        >
          <FileText className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 font-display text-sm leading-tight font-bold text-foreground">
            {feature.title}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide",
                STATUS_BADGE[status],
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  status === "done"
                    ? "bg-success"
                    : status === "active"
                      ? "bg-primary"
                      : "bg-muted-foreground/60",
                )}
              />
              {STATUS_LABEL[status]}
            </span>
            <span className="font-ui text-[11px] text-muted-foreground">·</span>
            <RelativeTime
              iso={feature.updatedAt}
              showIcon={false}
              className="text-[11px] text-muted-foreground"
            />
          </div>
        </div>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-ui text-xs font-semibold text-foreground/80">
            <span>
              {feature.filledCount}/{total}
            </span>{" "}
            sections
          </span>
          <span className="font-ui text-xs font-medium text-muted-foreground tabular-nums">
            {pct}%
          </span>
        </div>
        <ProgressBar value={pct} ariaLabel={`Sections progress ${pct}%`} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <AvatarStack names={contributors} size="sm" />
        <SectionDots filled={feature.filledCount} total={total} />
      </div>
    </Link>
  );
}
