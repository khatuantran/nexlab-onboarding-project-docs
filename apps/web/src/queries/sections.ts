import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import type { SectionResponse, SectionType, UpdateSectionRequest } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";
import { projectKeys } from "@/queries/projects";

export interface UpdateSectionVars extends UpdateSectionRequest {
  type: SectionType;
}

export function useUpdateSection(
  projectSlug: string,
  featureSlug: string,
  featureId: string,
): UseMutationResult<SectionResponse, Error, UpdateSectionVars> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, body }) =>
      apiFetch<SectionResponse>(`/features/${featureId}/sections/${type}`, {
        method: "PUT",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.feature(projectSlug, featureSlug) });
    },
  });
}
