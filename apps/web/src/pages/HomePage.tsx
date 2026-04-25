import { useMemo, useState } from "react";
import { CheckCircle2, FolderOpen, Plus, Users } from "lucide-react";
import { useMe } from "@/queries/auth";
import { useProjects } from "@/queries/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilterPills, type ProjectFilter } from "@/components/projects/ProjectFilterPills";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatChip } from "@/components/common/StatChip";
import { Button } from "@/components/ui/button";

function ProjectCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3.5">
        <div className="size-11 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="size-5 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex gap-1">
          <div className="size-7 animate-pulse rounded-full bg-muted" />
          <div className="size-7 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function HomePage(): JSX.Element {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const { data: me } = useMe();
  const isAdmin = me?.user.role === "admin";
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (filter === "active") return projects.filter((p) => p.featureCount > 0);
    if (filter === "draft") return projects.filter((p) => p.featureCount === 0);
    return projects;
  }, [projects, filter]);

  const totalProjects = projects?.length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 lg:px-10" aria-busy={isLoading || undefined}>
      {/* Hero row */}
      <div className="mb-6 flex flex-col items-stretch gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Workspace của bạn
          </p>
          <h1 className="mt-2 font-display text-[36px] leading-10 font-bold tracking-[-0.02em] text-foreground">
            Danh sách project
          </h1>
          <p className="mt-2.5 font-body text-[15px] leading-[22px] text-muted-foreground">
            Tất cả tài liệu onboarding cho các sprint đang chạy. Bấm vào project để xem feature và
            nghiệp vụ chi tiết.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatChip
            icon={FolderOpen}
            tone="primary"
            value={isLoading ? "—" : totalProjects}
            label="Project active"
          />
          <StatChip
            icon={CheckCircle2}
            tone="success"
            value={isLoading ? "—" : "0"}
            label="Feature đủ doc"
          />
          <StatChip icon={Users} tone="info" value="8" label="Đang đóng góp" />
        </div>
      </div>

      {/* Filter + count strip */}
      {!isError && totalProjects > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
          <ProjectFilterPills value={filter} onChange={setFilter} />
          <div className="ml-auto flex items-center gap-3">
            <span className="font-ui text-xs text-muted-foreground">
              Sắp xếp: <span className="font-semibold text-foreground">Mới cập nhật</span>
            </span>
            <span className="font-ui text-xs text-muted-foreground">
              {filtered.length} / {totalProjects} project
            </span>
          </div>
        </div>
      ) : null}

      {/* Body states */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p>Có lỗi xảy ra khi tải danh sách project. Thử lại sau.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : totalProjects === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Chưa có project nào trong catalog"
          description={
            isAdmin
              ? "Tạo project đầu tiên để team bắt đầu document features. BA viết business sections; dev bổ sung tech-notes + screenshots."
              : "Liên hệ admin để tạo project đầu tiên."
          }
          action={isAdmin ? <CreateProjectDialog triggerLabel="Tạo project đầu tiên" /> : null}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {isAdmin ? <AdminCreateTile /> : null}
        </div>
      )}
    </main>
  );
}

function AdminCreateTile(): JSX.Element {
  return (
    <CreateProjectDialog
      customTrigger={
        <button
          type="button"
          className="group flex min-h-[180px] items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Plus className="size-4 text-primary" aria-hidden="true" />
          </span>
          <span className="font-ui text-sm font-semibold">Tạo project mới</span>
        </button>
      }
    />
  );
}
