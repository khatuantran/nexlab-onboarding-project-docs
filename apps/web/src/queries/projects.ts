import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  CreateProjectRequest,
  FeatureListItem,
  FeatureResponse,
  ProjectResponse,
  ProjectSummary,
  SectionResponse,
  UpdateProjectRequest,
} from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

export const projectKeys = {
  all: ["projects"] as const,
  byId: (slug: string) => ["project", slug] as const,
  feature: (slug: string, featureSlug: string) => ["feature", slug, featureSlug] as const,
};

export function useProjects(): UseQueryResult<ProjectSummary[], Error> {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => apiFetch<ProjectSummary[]>("/projects"),
    retry: false,
  });
}

export interface ProjectWithFeatures {
  project: ProjectResponse;
  features: FeatureListItem[];
}

export function useProject(slug: string): UseQueryResult<ProjectWithFeatures, Error> {
  return useQuery({
    queryKey: projectKeys.byId(slug),
    queryFn: () => apiFetch<ProjectWithFeatures>(`/projects/${slug}`),
    retry: false,
  });
}

export interface FeatureWithSections {
  feature: FeatureResponse;
  sections: SectionResponse[];
}

export function useCreateProject(): UseMutationResult<
  ProjectResponse,
  Error,
  CreateProjectRequest
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      apiFetch<ProjectResponse>("/projects", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.byId(vars.slug) });
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject(
  slug: string,
): UseMutationResult<ProjectResponse, Error, UpdateProjectRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      apiFetch<ProjectResponse>(`/projects/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.byId(slug) });
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useArchiveProject(slug: string): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiFetch<void>(`/projects/${slug}/archive`, { method: "POST" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.byId(slug) });
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * US-008: admin-only soft-delete of a feature inside a project. Mirrors
 * `useArchiveProject` shape. Invalidate the project detail query so the
 * feature list refetches and the archived row disappears.
 */
export function useArchiveFeature(
  projectSlug: string,
  featureSlug: string,
): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiFetch<void>(`/projects/${projectSlug}/features/${featureSlug}/archive`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.byId(projectSlug) });
      qc.invalidateQueries({ queryKey: projectKeys.feature(projectSlug, featureSlug) });
    },
  });
}

export function useFeature(
  slug: string,
  featureSlug: string,
): UseQueryResult<FeatureWithSections, Error> {
  return useQuery({
    queryKey: projectKeys.feature(slug, featureSlug),
    queryFn: () => apiFetch<FeatureWithSections>(`/projects/${slug}/features/${featureSlug}`),
    retry: false,
  });
}
