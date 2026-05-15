import type { ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/Breadcrumb";
import { projectKeys, type ProjectWithFeatures } from "@/queries/projects";

interface BreadcrumbBarProps {
  rightSlot?: ReactNode;
}

/**
 * Row 2 của AppHeader v2 — breadcrumb trail bên trái + optional slot
 * bên phải (admin CTA). Auto-derives trail từ `useLocation()`:
 *
 *   /                                  → null (hidden)
 *   /search                            → Trang chủ › Tìm kiếm
 *   /admin/users                       → Trang chủ › Quản lý user
 *   /projects/:slug                    → Trang chủ › <project name>
 *   /projects/:slug/features/:fSlug    → Trang chủ › <project> › <featureSlug>
 *
 * Project name resolved qua `useProject(slug)` cache (already hydrated
 * by ProjectLandingPage / FeatureDetailPage), fallback slug.
 */
export function BreadcrumbBar({ rightSlot }: BreadcrumbBarProps): JSX.Element | null {
  const { pathname } = useLocation();
  const params = useParams<{ slug?: string; featureSlug?: string }>();
  const qc = useQueryClient();
  const cached = params.slug
    ? qc.getQueryData<ProjectWithFeatures>(projectKeys.byId(params.slug))
    : undefined;
  const projectName = cached?.project.name ?? params.slug ?? "";

  const items = buildItems(pathname, params, projectName);
  if (items.length === 0 && !rightSlot) return null;

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2.5">
      {items.length > 0 ? <Breadcrumb items={items} className="text-xs" /> : <span />}
      {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
    </div>
  );
}

function buildItems(
  pathname: string,
  params: { slug?: string; featureSlug?: string },
  projectName: string,
): BreadcrumbItem[] {
  if (pathname === "/" || pathname === "/login") return [];

  const home: BreadcrumbItem = { label: "Trang chủ", to: "/" };

  if (pathname === "/search") return [home, { label: "Tìm kiếm" }];
  if (pathname.startsWith("/admin/users")) return [home, { label: "Quản lý user" }];

  if (params.slug) {
    const items: BreadcrumbItem[] = [home];
    const projectTo = `/projects/${params.slug}`;
    items.push({
      label: projectName,
      to: params.featureSlug ? projectTo : undefined,
    });
    if (params.featureSlug) items.push({ label: params.featureSlug });
    return items;
  }

  return [];
}
