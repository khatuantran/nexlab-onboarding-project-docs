import { FolderOpen } from "lucide-react";
import { useMe } from "@/queries/auth";
import { useProjects } from "@/queries/projects";
import { ProjectRow } from "@/components/projects/ProjectRow";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

function ProjectRowSkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-4">
      <div className="min-w-0 space-y-2">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="size-5 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function HomePage(): JSX.Element {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const { data: me } = useMe();
  const isAdmin = me?.user.role === "admin";

  return (
    <main className="mx-auto max-w-5xl px-6 py-8" aria-busy={isLoading || undefined}>
      <h1 className="text-2xl font-semibold tracking-tight">Danh sách project</h1>

      <div className="mt-6">
        {isLoading ? (
          <div className="divide-y divide-border rounded-lg border border-border">
            <ProjectRowSkeleton />
            <ProjectRowSkeleton />
            <ProjectRowSkeleton />
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <p>Có lỗi xảy ra khi tải danh sách project. Thử lại sau.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : projects && projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Chưa có project nào trong catalog"
            description={
              isAdmin
                ? "Tạo project đầu tiên để bắt đầu organize onboarding content."
                : "Liên hệ admin để tạo project đầu tiên."
            }
            action={isAdmin ? <CreateProjectDialog triggerLabel="Tạo project đầu tiên" /> : null}
          />
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {projects?.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
