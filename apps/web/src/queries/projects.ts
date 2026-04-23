import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  FeatureListItem,
  FeatureResponse,
  ProjectResponse,
  SectionResponse,
} from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

export const projectKeys = {
  byId: (slug: string) => ["project", slug] as const,
  feature: (slug: string, featureSlug: string) => ["feature", slug, featureSlug] as const,
};

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
