import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AdminGate } from "@/components/common/AdminGate";
import { AuthorGate } from "@/components/common/AuthorGate";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateFeatureDialog } from "@/components/features/CreateFeatureDialog";
import { FeatureCard } from "@/components/features/FeatureCard";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { useProject } from "@/queries/projects";

export function ProjectLandingPage(): JSX.Element {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data, isPending, error } = useProject(slug);

  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8" aria-busy="true">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted/40" />
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
      <main className="mx-auto max-w-5xl px-6 py-8" role="alert">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Có lỗi xảy ra, thử lại sau.
        </p>
      </main>
    );
  }

  const { project, features } = data;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
          {project.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">Catalog {features.length} feature</p>
        </div>
        <div className="flex items-center gap-2">
          <AuthorGate>
            <CreateFeatureDialog projectSlug={project.slug} projectName={project.name} />
          </AuthorGate>
          <AdminGate>
            <ProjectActionsMenu project={project} />
          </AdminGate>
        </div>
      </header>

      {features.length === 0 ? (
        <EmptyState
          title="Chưa có feature nào trong project này"
          description="Admin hoặc BA sẽ thêm feature sớm."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.id} projectSlug={project.slug} feature={feature} />
          ))}
        </div>
      )}
    </main>
  );
}
