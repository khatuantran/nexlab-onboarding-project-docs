import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { UploadResponse } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

export function useUpload(featureId: string): UseMutationResult<UploadResponse, Error, File> {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch<UploadResponse>(`/features/${featureId}/uploads`, {
        method: "POST",
        body: fd,
      });
    },
  });
}
