import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ActivityPage, MeStats, RecentProjectItem, WorkspaceStats } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

export const statsKeys = {
  workspace: ["stats", "workspace"] as const,
  me: ["stats", "me"] as const,
  recent: (limit: number) => ["stats", "me", "recent", limit] as const,
  activity: (limit: number) => ["stats", "me", "activity", limit] as const,
};

export function useWorkspaceStats(): UseQueryResult<WorkspaceStats, Error> {
  return useQuery({
    queryKey: statsKeys.workspace,
    queryFn: () => apiFetch<WorkspaceStats>("/workspace/stats"),
    retry: false,
  });
}

export function useMeStats(): UseQueryResult<MeStats, Error> {
  return useQuery({
    queryKey: statsKeys.me,
    queryFn: () => apiFetch<MeStats>("/me/stats"),
    retry: false,
  });
}

export function useMyRecentProjects(limit = 4): UseQueryResult<RecentProjectItem[], Error> {
  return useQuery({
    queryKey: statsKeys.recent(limit),
    queryFn: () => apiFetch<RecentProjectItem[]>(`/me/recent-projects?limit=${limit}`),
    retry: false,
  });
}

export function useMyActivity(limit = 20): UseQueryResult<ActivityPage, Error> {
  return useQuery({
    queryKey: statsKeys.activity(limit),
    queryFn: () => apiFetch<ActivityPage>(`/me/activity?limit=${limit}`),
    retry: false,
  });
}
