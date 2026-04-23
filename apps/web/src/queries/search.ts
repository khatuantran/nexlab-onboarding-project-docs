import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SearchHit } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

export const searchKeys = {
  byQuery: (q: string, projectSlug?: string) => ["search", q, projectSlug ?? null] as const,
};

export interface UseSearchArgs {
  q: string;
  projectSlug?: string;
}

export function useSearch(args: UseSearchArgs): UseQueryResult<SearchHit[], Error> {
  const { q, projectSlug } = args;
  const params = new URLSearchParams({ q });
  if (projectSlug) params.set("projectSlug", projectSlug);

  return useQuery({
    queryKey: searchKeys.byQuery(q, projectSlug),
    queryFn: () => apiFetch<SearchHit[]>(`/search?${params.toString()}`),
    enabled: q.length > 0,
    retry: false,
  });
}
