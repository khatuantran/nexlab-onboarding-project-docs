import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FolderOpen,
  Grid as GridIcon,
  List as ListIcon,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useMe } from "@/queries/auth";
import { useProjects } from "@/queries/projects";
import { GradientHero } from "@/components/patterns/GradientHero";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ProjectFilter = "all" | "active" | "doc" | "needs";

const FILTERS: Array<{ id: ProjectFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "active", label: "Đang chạy" },
  { id: "doc", label: "Đủ doc" },
  { id: "needs", label: "Cần bổ sung" },
];

interface StatTileProps {
  icon: typeof FolderOpen;
  /** Tailwind gradient class pair, e.g. "from-primary-700 to-primary". */
  gradient: string;
  value: string | number;
  label: string;
}

function StatTile({ icon: Icon, gradient, value, label }: StatTileProps): JSX.Element {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.06] p-[18px_14px_16px] text-center backdrop-blur-md">
      <span
        aria-hidden="true"
        className={cn(
          "mb-2.5 inline-flex size-[42px] items-center justify-center rounded-[12px] bg-gradient-to-br shadow-[0_4px_14px_rgba(0,0,0,0.35)]",
          gradient,
        )}
      >
        <Icon className="size-5 text-white" />
      </span>
      <div className="font-display text-[26px] font-black tracking-[-0.02em] text-white">
        {value}
      </div>
      <div className="mt-1.5 font-ui text-[11px]/[1.3] font-semibold text-white/50">{label}</div>
    </div>
  );
}

function ProjectCardSkeleton(): JSX.Element {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="h-[150px] animate-pulse bg-muted" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex gap-1 pt-2">
          <div className="h-1.5 flex-1 animate-pulse rounded-full bg-muted" />
          <div className="h-1.5 flex-1 animate-pulse rounded-full bg-muted" />
          <div className="h-1.5 flex-1 animate-pulse rounded-full bg-muted" />
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
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!projects) return [];
    let result = projects;
    if (filter === "active") result = result.filter((p) => p.featureCount > 0);
    else if (filter === "needs") result = result.filter((p) => p.featureCount === 0);
    // "doc" placeholder == active until BE filledSectionCount lands.
    else if (filter === "doc") result = result.filter((p) => p.featureCount > 0);
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [projects, filter, query]);

  const totalProjects = projects?.length ?? 0;
  const totalFeatures = projects?.reduce((acc, p) => acc + p.featureCount, 0) ?? 0;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background" aria-busy={isLoading || undefined}>
      {/* Hero — full-bleed dark gradient + 3 blobs + 4 stat tiles */}
      <GradientHero showWatermark gridOverlay className="px-10 pb-14 pt-11">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end">
          <div className="flex-1">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/[0.22] px-3.5 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-[#FFD092]">
                ✦ Sprint 14 · Q2 2026
              </span>
              {totalFeatures > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/[0.18] px-3.5 py-1 font-ui text-[11px] font-semibold text-green-200">
                  <span
                    aria-hidden="true"
                    className="size-1.5 animate-pulse rounded-full bg-green-300"
                  />
                  {totalFeatures} đang chỉnh
                </span>
              ) : null}
            </div>
            <h1 className="font-display text-[44px] font-black leading-[1.05] tracking-[-0.03em] text-white sm:text-[56px] sm:leading-[60px]">
              Workspace
              <br />
              <span className="bg-gradient-to-r from-[hsl(var(--logo-grad-start))] to-[hsl(var(--logo-grad-end))] bg-clip-text text-transparent">
                của bạn
              </span>
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile
              icon={FolderOpen}
              gradient="from-primary-700 to-primary"
              value={isLoading ? "—" : totalProjects}
              label="Projects"
            />
            <StatTile
              icon={CheckCircle2}
              gradient="from-green-700 to-green-500"
              value={isLoading ? "—" : totalFeatures}
              label="Đủ tài liệu"
            />
            <StatTile
              icon={Users}
              gradient="from-purple-700 to-purple-500"
              value="8"
              label="Đóng góp"
            />
            <StatTile
              icon={Clock}
              gradient="from-blue-700 to-blue-500"
              value="2.3h"
              label="Onboard TB"
            />
          </div>
        </div>
      </GradientHero>

      {/* Floating filter bar — overlaps hero edge */}
      <div className="relative -mt-[22px] px-10">
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-border bg-background p-2.5 px-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
          <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            aria-label="Tìm dự án, owner, tag"
            placeholder="Tìm project, owner, tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-[120px] flex-1 border-0 bg-transparent font-ui text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
          <span aria-hidden="true" className="hidden h-[22px] w-px bg-border sm:block" />
          <div role="tablist" aria-label="Lọc dự án" className="flex flex-wrap gap-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-8 rounded-md px-3.5 font-ui text-[13px] font-semibold transition-colors",
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {isAdmin ? (
            <>
              <span aria-hidden="true" className="hidden h-[22px] w-px bg-border sm:block" />
              <CreateProjectDialog triggerLabel="+ Tạo mới" />
            </>
          ) : null}
        </div>
      </div>

      {/* Count + view toggle row */}
      {!isError && totalProjects > 0 ? (
        <div className="flex items-center justify-between px-10 pb-4 pt-5">
          <span className="font-ui text-[14px] font-bold text-foreground">
            {totalProjects} projects
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Hiển thị dạng lưới"
              aria-pressed="true"
              className="inline-flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary-50"
            >
              <GridIcon className="size-[15px] text-primary-700" />
            </button>
            <button
              type="button"
              aria-label="Hiển thị dạng danh sách"
              disabled
              className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-md border border-border bg-background opacity-60"
            >
              <ListIcon className="size-[15px] text-muted-foreground" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Body */}
      <div className="px-10 pb-15">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        ) : filtered.length === 0 ? (
          <div
            role="status"
            className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center"
          >
            <span aria-hidden="true" role="img" className="select-none text-5xl leading-none">
              🔍
            </span>
            <p className="font-display text-base font-semibold text-foreground">
              Không tìm thấy dự án nào khớp với “{query.trim()}”
            </p>
            <p className="font-ui text-sm text-muted-foreground">
              Thử từ khoá khác hoặc đổi bộ lọc.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-border bg-transparent text-center transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-[16px] bg-primary-50 transition-transform group-hover:scale-105">
            <Plus aria-hidden="true" className="size-6 text-primary-700" />
          </span>
          <span className="font-display text-base font-semibold text-foreground">
            Tạo dự án mới
          </span>
        </button>
      }
    />
  );
}
