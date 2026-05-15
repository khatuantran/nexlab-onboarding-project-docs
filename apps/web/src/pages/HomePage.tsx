import { useMemo, useState } from "react";
import { CheckCircle2, FolderOpen, Plus, Users } from "lucide-react";
import { useMe } from "@/queries/auth";
import { useProjects } from "@/queries/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilterMenu, type ProjectFilter } from "@/components/projects/ProjectFilterMenu";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { Button } from "@/components/ui/button";

interface StatBoxProps {
  icon: typeof FolderOpen;
  tone: "primary" | "sage";
  value: string | number;
  label: string;
}

const STAT_TONE_PLATE: Record<StatBoxProps["tone"], string> = {
  primary: "bg-primary text-primary-foreground",
  sage: "bg-sage text-sage-foreground",
};

function StatBox({ icon: Icon, tone, value, label }: StatBoxProps): JSX.Element {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <span
        aria-hidden="true"
        className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl ${STAT_TONE_PLATE[tone]}`}
      >
        <Icon className="size-6" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="font-display text-[32px] font-bold leading-none tabular-nums text-foreground">
          {value}
        </span>
        <span className="mt-1 font-ui text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

function ProjectCardSkeleton(): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="h-20 animate-pulse bg-muted" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        </div>
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
    <main className="min-h-[calc(100vh-3.5rem)] bg-canvas" aria-busy={isLoading || undefined}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Hero — CR-006 v3: compact title only, no subtitle (ít chữ) */}
        <header className="mb-8">
          <h1 className="font-display text-[36px] font-bold leading-10 tracking-[-0.02em] text-foreground">
            Góc onboarding{" "}
            <span aria-hidden="true" role="img">
              👋
            </span>
          </h1>
        </header>

        {/* Stat row — 3 cards solid-filled icon plates */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatBox
            icon={FolderOpen}
            tone="primary"
            value={isLoading ? "—" : totalProjects}
            label="Project active"
          />
          <StatBox
            icon={CheckCircle2}
            tone="sage"
            value={isLoading ? "—" : totalFeatures}
            label="Feature đủ doc"
          />
          <StatBox icon={Users} tone="sage" value="8" label="Đang đóng góp" />
        </div>

        {/* Section header — h2 + Lọc dropdown + admin solid-filled CTA */}
        {!isError && totalProjects > 0 ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[20px] font-semibold text-foreground">Dự án</h2>
            <div className="flex items-center gap-2">
              <ProjectFilterMenu value={filter} onChange={setFilter} />
              {isAdmin ? <CreateProjectDialog triggerLabel="+ Tạo dự án mới" /> : null}
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
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <p>Có lỗi xảy ra khi tải danh sách dự án. Thử lại sau.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : totalProjects === 0 ? (
          <div
            role="status"
            className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
          >
            <span aria-hidden="true" role="img" className="select-none text-6xl leading-none">
              📁
            </span>
            <p className="font-display text-xl font-semibold text-foreground">
              Chưa có dự án nào ✨
            </p>
            {isAdmin ? <CreateProjectDialog triggerLabel="+ Tạo dự án đầu tiên" /> : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {isAdmin ? <AdminCreateTile /> : null}
          </div>
        )}
      </div>
    </main>
  );
}

function AdminCreateTile(): JSX.Element {
  return (
    <CreateProjectDialog
      customTrigger={
        <button
          type="button"
          className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-canvas-muted/30 text-center transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Plus aria-hidden="true" className="size-6" />
          </span>
          <span className="font-display text-base font-semibold text-foreground">
            Tạo dự án mới
          </span>
        </button>
      }
    />
  );
}
