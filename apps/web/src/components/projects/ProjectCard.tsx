import { BookOpen, FolderKanban, GitBranch, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectSummary } from "@onboarding/shared";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { RelativeTime } from "@/components/common/RelativeTime";
import { useMe } from "@/queries/auth";

interface ProjectCardProps {
  project: ProjectSummary;
}

const BANNER_TONES = ["primary", "sage"] as const;
type BannerTone = (typeof BANNER_TONES)[number];

const BANNER_ICONS: LucideIcon[] = [BookOpen, FolderKanban, Layers, GitBranch];

// Deterministic slug hash → banner tone + icon (CR-006 v3 graphics-rich).
function bannerFromSlug(slug: string): { tone: BannerTone; Icon: LucideIcon } {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return {
    tone: BANNER_TONES[hash % BANNER_TONES.length]!,
    Icon: BANNER_ICONS[hash % BANNER_ICONS.length]!,
  };
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

const TONE_BANNER_BG: Record<BannerTone, string> = {
  primary: "bg-primary",
  sage: "bg-sage",
};

/**
 * Catalog grid card per home.md §v3 amendments (CR-006 / Phase C3).
 * Graphics-rich banner top (solid filled, icon + initials white) + body
 * with title + 2 metric chips. No description paragraph (v3 "ít chữ").
 */
export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  const { data: me } = useMe();
  const isAdmin = me?.user.role === "admin";

  const { tone, Icon } = bannerFromSlug(project.slug);

  return (
    <Link
      to={`/projects/${project.slug}`}
      aria-label={`Xem chi tiết dự án ${project.name}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={`relative flex h-20 items-center justify-center gap-3 ${TONE_BANNER_BG[tone]}`}
      >
        <Icon aria-hidden="true" className="size-7 text-white" />
        <span className="font-display text-2xl font-bold text-white">{initials(project.name)}</span>
        {isAdmin ? (
          <div
            className="absolute right-2 top-2 z-10 rounded-md bg-white/15 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ProjectActionsMenu project={project} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-1 font-display text-base font-semibold leading-tight text-foreground">
          {project.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-bg px-2.5 py-1 text-xs font-semibold text-sage-text">
            📄 {project.featureCount} feature{project.featureCount === 1 ? "" : "s"}
          </span>
          <RelativeTime
            iso={project.updatedAt}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-muted-foreground"
          />
        </div>
      </div>
    </Link>
  );
}
