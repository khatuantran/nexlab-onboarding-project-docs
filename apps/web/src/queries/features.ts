import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import type { CreateFeatureRequest, FeatureResponse } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";
import { projectKeys } from "@/queries/projects";

export function useCreateFeature(
  projectSlug: string,
): UseMutationResult<FeatureResponse, Error, CreateFeatureRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      apiFetch<FeatureResponse>(`/projects/${projectSlug}/features`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.byId(projectSlug) });
    },
  });
}
