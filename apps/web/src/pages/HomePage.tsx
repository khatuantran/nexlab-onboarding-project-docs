import { useMemo, useState } from "react";
import { CheckCircle2, FolderOpen, LayoutGrid, Plus, Users } from "lucide-react";
import { useMe } from "@/queries/auth";
import { useProjects } from "@/queries/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilterMenu, type ProjectFilter } from "@/components/projects/ProjectFilterMenu";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { StatChip } from "@/components/common/StatChip";
import { DotField } from "@/components/patterns";
import { Button } from "@/components/ui/button";

function ProjectCardSkeleton(): JSX.Element {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 pt-6">
      <div className="absolute inset-x-0 top-0 h-1.5 animate-pulse bg-muted" />
      <div className="flex items-start gap-3.5">
        <div className="size-11 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
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
  const totalFeatures = projects?.reduce((acc, p) => acc + p.featureCount, 0) ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 lg:px-10" aria-busy={isLoading || undefined}>
      {/* Hero — CR-005 v3 pilot v2: clean bg, title + 1-line welcome */}
      <header className="mb-8">
        <h1 className="font-display text-[36px] font-bold leading-10 tracking-[-0.02em] text-foreground">
          Workspace
        </h1>
        <p className="mt-2 max-w-2xl font-body text-[15px] leading-[22px] text-muted-foreground">
          Chào mừng bạn trở lại! Dưới đây là tổng quan về hoạt động và tiến độ các dự án đang diễn
          ra của bạn.
        </p>
      </header>

      {/* Stat row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatChip
          icon={FolderOpen}
          tone="primary"
          topAccent
          value={isLoading ? "—" : totalProjects}
          label="Project active"
        />
        <StatChip
          icon={CheckCircle2}
          tone="blue"
          topAccent
          value={isLoading ? "—" : totalFeatures}
          label="Feature đủ doc"
        />
        <StatChip icon={Users} tone="pink" topAccent value="8" label="Đang đóng góp" />
      </div>

      {/* Section header */}
      {!isError && totalProjects > 0 ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 font-display text-[17px] font-semibold text-foreground">
            <LayoutGrid aria-hidden="true" className="size-[18px] text-primary" />
            Dự án của bạn
          </h2>
          <div className="flex items-center gap-2">
            <ProjectFilterMenu value={filter} onChange={setFilter} />
            {isAdmin ? <CreateProjectDialog triggerLabel="+ Dự án mới" /> : null}
          </div>
        </div>
      ) : null}

      {/* Body states */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
        <div
          role="status"
          className="relative mx-auto flex max-w-md flex-col items-center gap-3 overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center"
        >
          <DotField
            tone="primary"
            count={14}
            opacity={0.22}
            className="absolute inset-0 h-full w-full dark:opacity-[0.15]"
          />
          <div className="relative flex flex-col items-center gap-3">
            <FolderOpen aria-hidden="true" className="size-14 text-primary/50" />
            <p className="font-display text-xl font-semibold text-foreground">
              Chưa có project nào
            </p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Tạo project đầu tiên để team bắt đầu document."
                : "Liên hệ admin để tạo project đầu tiên."}
            </p>
            {isAdmin ? (
              <div className="pt-2">
                <CreateProjectDialog triggerLabel="Tạo project đầu tiên" />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
          className="group flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-transparent px-4 text-center text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Plus className="size-4 text-primary" aria-hidden="true" />
          </span>
          <span className="font-ui text-sm font-semibold text-foreground">Tạo dự án mới</span>
          <span className="font-ui text-xs text-muted-foreground">
            Bắt đầu một không gian làm việc mới
          </span>
        </button>
      }
    />
  );
}
