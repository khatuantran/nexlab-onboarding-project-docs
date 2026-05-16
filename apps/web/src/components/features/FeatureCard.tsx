import { Check, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import type { FeatureListItem } from "@onboarding/shared";
import { AvatarStack } from "@/components/common/AvatarStack";
import { RelativeTime } from "@/components/common/RelativeTime";
import { FeatureActionsMenu } from "@/components/features/FeatureActionsMenu";
import { useMe } from "@/queries/auth";

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

const GRADIENTS = [
  "bg-gradient-to-br from-primary-700 to-primary",
  "bg-gradient-to-br from-green-700 to-green-500",
  "bg-gradient-to-br from-purple-700 to-purple-500",
  "bg-gradient-to-br from-amber-700 to-amber-500",
  "bg-gradient-to-br from-blue-700 to-blue-500",
  "bg-gradient-to-br from-rose-700 to-rose-500",
];

function deriveStatus(filled: number): Status {
  if (filled >= 5) return "done";
  if (filled >= 1) return "active";
  return "draft";
}

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Feature card v4 (CR-006 v4) — vivid gradient header (1 of 6 palettes
 * by slug hash) + status icon plate / Check + ProgressRing 44 white +
 * title in header + light body with section dots + AvatarStack +
 * updated time. Replaces v2 light icon-row card.
 */
export function FeatureCard({ projectSlug, feature }: FeatureCardProps): JSX.Element {
  const { data: me } = useMe();
  const isAdmin = me?.user.role === "admin";
  const status = deriveStatus(feature.filledCount);
  const total = 5;
  const gradient = GRADIENTS[hashSlug(feature.slug) % GRADIENTS.length]!;
  const contributors = ["TM", "NL"];

  return (
    <Link
      to={`/projects/${projectSlug}/features/${feature.slug}`}
      aria-label={`Xem chi tiết feature ${feature.title}`}
      className="card-hover group relative flex flex-col overflow-hidden rounded-[18px] border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Gradient header */}
      <div
        className={`relative min-h-[120px] overflow-hidden p-[20px_18px_16px] text-white ${gradient}`}
      >
        <span
          aria-hidden="true"
          className="absolute -right-8 -top-8 size-[110px] rounded-full bg-white/[0.12]"
        />
        <div className="relative flex items-start justify-between">
          <span
            aria-hidden="true"
            className="inline-flex size-9 items-center justify-center rounded-[10px] bg-white/20"
          >
            {status === "done" ? (
              <Check className="size-[18px] text-white" strokeWidth={2.5} />
            ) : (
              <FileText className="size-[18px] text-white" />
            )}
          </span>
        </div>
        <div className="relative mt-2.5 line-clamp-1 font-display text-[14px] font-bold leading-[20px] text-white">
          {feature.title}
        </div>
        <span className="relative mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 font-ui text-[10px] font-bold text-white">
          <span aria-hidden="true" className="size-1 rounded-full bg-white" />
          {STATUS_LABEL[status]}
        </span>
      </div>

      {isAdmin ? (
        <div
          className="absolute right-2 top-2 z-10"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <FeatureActionsMenu projectSlug={projectSlug} feature={feature} />
        </div>
      ) : null}

      {/* Light body — section dots + footer */}
      <div className="flex flex-1 flex-col gap-2 p-[12px_16px_14px]">
        <div className="flex items-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-[5px] w-[20px] rounded-full ${
                i < feature.filledCount ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <RelativeTime
            iso={feature.updatedAt}
            showIcon={false}
            className="!font-ui !text-[11px] !text-muted-foreground"
          />
          <AvatarStack names={contributors} size="xs" />
        </div>
      </div>
    </Link>
  );
}
