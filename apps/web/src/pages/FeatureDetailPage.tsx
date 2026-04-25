import { useMemo } from "react";
import { Bookmark, Eye, MoreHorizontal, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthorGate } from "@/components/common/AuthorGate";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ProgressStrip } from "@/components/common/ProgressStrip";
import { RelativeTime } from "@/components/common/RelativeTime";
import { ActivityRail } from "@/components/features/ActivityRail";
import { FeatureSections } from "@/components/features/FeatureSections";
import { SectionToc, SectionTocMobile } from "@/components/features/SectionToc";
import { useFeature } from "@/queries/projects";

const SECTION_LABELS_SHORT = ["Nghiệp vụ", "Flow", "Rules", "Tech", "Screens"];

function placeholderToast(label: string): () => void {
  return () => toast(`${label}: tính năng đang phát triển trong v2`);
}

function deriveStatus(filled: number): { label: string; tone: "primary" | "success" | "muted" } {
  if (filled >= 5) return { label: "Đủ doc", tone: "success" };
  if (filled >= 1) return { label: "Đang viết", tone: "primary" };
  return { label: "Draft", tone: "muted" };
}

export function FeatureDetailPage(): JSX.Element {
  const { slug = "", featureSlug = "" } = useParams<{
    slug: string;
    featureSlug: string;
  }>();
  const { data, isPending, error } = useFeature(slug, featureSlug);

  const filledCount = useMemo(() => {
    if (!data) return 0;
    return data.sections.filter((s) => s.body.trim().length > 0).length;
  }, [data]);

  if (isPending) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-10" aria-busy="true">
        <div className="mb-6 h-4 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mb-2 h-8 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
        <div className="mt-7 h-14 animate-pulse rounded-xl bg-muted" />
        <div className="mt-7 grid gap-8 lg:grid-cols-[200px_1fr] xl:grid-cols-[240px_1fr_280px]">
          <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
        </div>
      </main>
    );
  }

  if (error instanceof ApiError && error.code === "FEATURE_NOT_FOUND") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <Card className="text-center">
          <h1 className="text-xl font-semibold">Không tìm thấy feature "{featureSlug}"</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Có thể slug sai, hoặc feature đã bị xóa.
          </p>
          <div className="mt-6">
            <Link
              to={`/projects/${slug}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ← Về project
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-10" role="alert">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Có lỗi xảy ra, thử lại sau.
        </p>
      </main>
    );
  }

  const { feature, sections } = data;
  const status = deriveStatus(filledCount);
  const lastUpdater = sections.reduce<{ name: string | null; time: string }>(
    (acc, s) => {
      if (s.body.trim().length > 0 && s.updatedAt > acc.time) {
        return { name: s.updatedByName, time: s.updatedAt };
      }
      return acc;
    },
    { name: null, time: feature.updatedAt },
  );

  const handleQuickEdit = (): void => {
    const empty = sections.find((s) => s.body.trim().length === 0);
    const target = empty ?? sections[0];
    if (!target) return;
    document
      .getElementById(`section-${target.type}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Projects", to: "/" },
          { label: slug, to: `/projects/${slug}` },
          { label: feature.title },
        ]}
      />

      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide ${
                status.tone === "success"
                  ? "bg-success/15 text-success"
                  : status.tone === "primary"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${
                  status.tone === "success"
                    ? "bg-success"
                    : status.tone === "primary"
                      ? "bg-primary"
                      : "bg-muted-foreground/60"
                }`}
              />
              {status.label}
            </span>
            <span className="rounded-full bg-info/15 px-2.5 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide text-info">
              v2
            </span>
            <span className="font-ui text-xs text-muted-foreground">
              · Cập nhật{" "}
              <RelativeTime
                iso={feature.updatedAt}
                showIcon={false}
                className="inline-flex text-xs"
              />
              {lastUpdater.name ? (
                <>
                  {" "}
                  · @<strong className="font-medium text-foreground/80">{lastUpdater.name}</strong>
                </>
              ) : null}
            </span>
          </div>
          <h1 className="font-display text-[32px] leading-10 font-bold tracking-[-0.02em] text-foreground">
            {feature.title}
          </h1>
          <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-foreground/80">
            Tài liệu nghiệp vụ + tech notes. Mọi section đều có thể chỉnh sửa song song bởi BA và
            Dev.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" type="button" onClick={placeholderToast("Xem PR")}>
            <Eye className="mr-2 size-4" aria-hidden="true" />
            Xem PR
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={placeholderToast("Theo dõi feature")}
          >
            <Bookmark className="mr-2 size-4" aria-hidden="true" />
            Theo dõi
          </Button>
          <AuthorGate>
            <Button variant="default" size="sm" type="button" onClick={handleQuickEdit}>
              <Pencil className="mr-2 size-4" aria-hidden="true" />
              Sửa nhanh
            </Button>
          </AuthorGate>
          <AuthorGate>
            <Button
              variant="outline"
              size="icon"
              type="button"
              aria-label="Thao tác feature"
              onClick={placeholderToast("Menu admin feature")}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </AuthorGate>
        </div>
      </header>

      <ProgressStrip
        filled={filledCount}
        total={5}
        labels={SECTION_LABELS_SHORT}
        className="mb-7"
      />

      <SectionTocMobile />

      <div className="grid gap-8 lg:grid-cols-[200px_1fr] xl:grid-cols-[240px_1fr_280px]">
        <SectionToc sections={sections} />
        <article className="min-w-0">
          <FeatureSections
            projectSlug={slug}
            featureSlug={featureSlug}
            featureId={feature.id}
            sections={sections}
          />
        </article>
        <ActivityRail sections={sections} />
      </div>
    </main>
  );
}
