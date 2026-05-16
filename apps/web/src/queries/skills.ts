import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { SkillItem, UpdateSkillsRequest } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

const skillsKey = ["skills", "me"] as const;

export function useMySkills(): UseQueryResult<SkillItem[], Error> {
  return useQuery({
    queryKey: skillsKey,
    queryFn: () => apiFetch<SkillItem[]>("/me/skills"),
    retry: false,
  });
}

export function useUpdateMySkills(): UseMutationResult<SkillItem[], Error, UpdateSkillsRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      apiFetch<SkillItem[]>("/me/skills", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: skillsKey });
    },
  });
}
