import { ChevronRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { SECTION_ORDER, type FeatureListItem } from "@onboarding/shared";
import { Card } from "@/components/ui/card";
import { RelativeTime } from "@/components/common/RelativeTime";
import { SectionBadge } from "@/components/features/SectionBadge";

interface FeatureCardProps {
  projectSlug: string;
  feature: FeatureListItem;
}

export function FeatureCard({ projectSlug, feature }: FeatureCardProps): JSX.Element {
  return (
    <Link
      to={`/projects/${projectSlug}/features/${feature.slug}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Xem chi tiết feature ${feature.title}`}
    >
      <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start gap-2">
          <FileText aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          <h2 className="text-base font-medium text-foreground">{feature.title}</h2>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SectionBadge filled={feature.filledCount} total={SECTION_ORDER.length} />
            <RelativeTime iso={feature.updatedAt} />
          </div>
          <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}
