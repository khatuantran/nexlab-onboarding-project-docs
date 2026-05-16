import { useMemo } from "react";
import { Code, FolderPlus, Plus, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { FeatureListItem, ProjectResponse } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AdminGate } from "@/components/common/AdminGate";
import { AuthorGate } from "@/components/common/AuthorGate";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateFeatureDialog } from "@/components/features/CreateFeatureDialog";
import { FeatureCard } from "@/components/features/FeatureCard";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useProject } from "@/queries/projects";

function placeholderToast(label: string): () => void {
  return () => toast(`${label}: tính năng đang phát triển trong v2`);
}

function FeatureCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="size-9 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="size-4 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <div className="flex gap-1">
          <div className="size-7 animate-pulse rounded-full bg-muted" />
          <div className="size-7 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-2 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function HeroSkeleton(): JSX.Element {
  return (
    <section className="mb-7 overflow-hidden rounded-2xl border border-border bg-muted/40 p-7">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-10 w-72 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-6 flex gap-7">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthorCreateTile({
  projectSlug,
  projectName,
}: {
  projectSlug: string;
  projectName: string;
}): JSX.Element {
  return (
    <CreateFeatureDialog
      projectSlug={projectSlug}
      projectName={projectName}
      customTrigger={
        <button
          type="button"
          className="flex min-h-[140px] items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Plus className="size-4 text-primary" aria-hidden="true" />
          </span>
          <span className="font-ui text-sm font-semibold">Tạo feature mới</span>
        </button>
      }
    />
  );
}

export function ProjectLandingPage(): JSX.Element {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data, isPending, error } = useProject(slug);

  if (isPending) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-10" aria-busy="true">
        <HeroSkeleton />
        <div className="grid gap-3.5 sm:grid-cols-1 lg:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <FeatureCardSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }

  if (error instanceof ApiError && error.code === "PROJECT_NOT_FOUND") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <Card className="text-center">
          <h1 className="text-xl font-semibold">Không tìm thấy project "{slug}"</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Có thể slug sai, hoặc bạn không có quyền truy cập.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ← Về trang chủ
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-10" role="alert">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Có lỗi xảy ra, thử lại sau.
        </p>
      </main>
    );
  }

  const { project, features } = data;

  return (
    <main className="bg-background pb-16">
      <HeroBlock project={project} features={features} />

      <div className="px-10">
        <ProjectTabs
          featureCount={features.length}
          catalogChildren={
            features.length === 0 ? (
              <EmptyState
                icon={FolderPlus}
                title="Chưa có feature nào trong project này"
                description="Project mới được tạo. Dùng nút Thêm feature ở header để bắt đầu document."
              />
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                {features.map((feature) => (
                  <FeatureCard key={feature.id} projectSlug={project.slug} feature={feature} />
                ))}
                <AuthorGate>
                  <AuthorCreateTile projectSlug={project.slug} projectName={project.name} />
                </AuthorGate>
              </div>
            )
          }
        />
      </div>
    </main>
  );
}

function HeroBlock({
  project,
  features,
}: {
  project: ProjectResponse;
  features: FeatureListItem[];
}): JSX.Element {
  const { totalSections, filledSections, doneCount, lastUpdatedAt } = useMemo(() => {
    const total = features.length * 5;
    const filled = features.reduce((sum, f) => sum + f.filledCount, 0);
    const done = features.filter((f) => f.filledCount >= 5).length;
    const last = features.reduce<string | null>((acc, f) => {
      if (!acc || f.updatedAt > acc) return f.updatedAt;
      return acc;
    }, null);
    return {
      totalSections: total,
      filledSections: filled,
      doneCount: done,
      lastUpdatedAt: last,
    };
  }, [features]);

  return (
    <ProjectHero
      name={project.name}
      description={project.description}
      featureCount={features.length}
      doneFeatureCount={doneCount}
      totalSections={totalSections}
      filledSections={filledSections}
      lastUpdatedAt={lastUpdatedAt}
      lastUpdatedBy={null}
      actions={
        <>
          <button
            type="button"
            onClick={placeholderToast("Theo dõi project")}
            className="inline-flex items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3.5 py-2 font-ui text-[13px] font-semibold text-white backdrop-blur-sm hover:bg-white/15"
          >
            <Star aria-hidden="true" className="size-3.5" />
            Theo dõi
          </button>
          <button
            type="button"
            onClick={placeholderToast("Mở repo")}
            className="inline-flex items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3.5 py-2 font-ui text-[13px] font-semibold text-white backdrop-blur-sm hover:bg-white/15"
          >
            <Code aria-hidden="true" className="size-3.5" />
            Repo
          </button>
          <AuthorGate>
            <CreateFeatureDialog projectSlug={project.slug} projectName={project.name} />
          </AuthorGate>
          <AdminGate>
            <div className="rounded-[10px] bg-white/15 backdrop-blur-sm">
              <ProjectActionsMenu project={project} />
            </div>
          </AdminGate>
        </>
      }
    />
  );
}
