import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { FeatureStatus, SearchResultsV2, SectionType } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

export const searchKeys = {
  byQuery: (q: string, opts: SearchQueryOpts) =>
    [
      "search",
      q,
      opts.projectSlug ?? null,
      opts.sectionTypes?.slice().sort().join(",") ?? null,
      opts.authorId ?? null,
      opts.updatedSince ?? null,
      opts.status ?? null,
    ] as const,
};

export interface SearchQueryOpts {
  projectSlug?: string;
  sectionTypes?: SectionType[];
  authorId?: string;
  updatedSince?: string;
  status?: FeatureStatus;
}

export interface UseSearchArgs extends SearchQueryOpts {
  q: string;
}

export const EMPTY_SEARCH_RESULTS: SearchResultsV2 = {
  projects: [],
  features: [],
  sections: [],
  authors: [],
  uploads: [],
};

export function useSearch(args: UseSearchArgs): UseQueryResult<SearchResultsV2, Error> {
  const { q, ...opts } = args;
  const params = new URLSearchParams({ q });
  if (opts.projectSlug) params.set("projectSlug", opts.projectSlug);
  if (opts.sectionTypes && opts.sectionTypes.length > 0)
    params.set("sectionTypes", opts.sectionTypes.join(","));
  if (opts.authorId) params.set("authorId", opts.authorId);
  if (opts.updatedSince) params.set("updatedSince", opts.updatedSince);
  if (opts.status) params.set("status", opts.status);

  return useQuery({
    queryKey: searchKeys.byQuery(q, opts),
    queryFn: () => apiFetch<SearchResultsV2>(`/search?${params.toString()}`),
    enabled: q.length > 0,
    retry: false,
  });
}

export function totalHits(data: SearchResultsV2 | undefined): number {
  if (!data) return 0;
  return (
    data.projects.length +
    data.features.length +
    data.sections.length +
    data.authors.length +
    data.uploads.length
  );
}
