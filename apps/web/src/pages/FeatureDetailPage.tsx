import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { RelativeTime } from "@/components/common/RelativeTime";
import { FeatureSections } from "@/components/features/FeatureSections";
import { SectionToc, SectionTocMobile } from "@/components/features/SectionToc";
import { useFeature } from "@/queries/projects";

export function FeatureDetailPage(): JSX.Element {
  const { slug = "", featureSlug = "" } = useParams<{
    slug: string;
    featureSlug: string;
  }>();
  const { data, isPending, error } = useFeature(slug, featureSlug);

  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8" aria-busy="true">
        <div className="mb-6 h-4 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mb-2 h-8 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-10 space-y-10">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
              <div className="h-24 animate-pulse rounded-md bg-muted/60" />
            </div>
          ))}
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
      <main className="mx-auto max-w-5xl px-6 py-8" role="alert">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Có lỗi xảy ra, thử lại sau.
        </p>
      </main>
    );
  }

  const { feature, sections } = data;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Projects", to: "/" },
          { label: slug, to: `/projects/${slug}` },
          { label: feature.title },
        ]}
      />
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{feature.title}</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Cập nhật</span>
          <RelativeTime iso={feature.updatedAt} showIcon={false} />
        </div>
      </header>

      <SectionTocMobile />

      <div className="lg:grid lg:grid-cols-[180px_1fr] lg:gap-8">
        <SectionToc />
        <article className="min-w-0">
          <FeatureSections
            projectSlug={slug}
            featureSlug={featureSlug}
            featureId={feature.id}
            sections={sections}
          />
        </article>
      </div>
    </main>
  );
}
