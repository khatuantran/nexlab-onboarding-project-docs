import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import type { AuthUser, ChangePasswordRequest, UpdateMyProfileRequest } from "@onboarding/shared";
import { apiFetch } from "@/lib/api";
import { authKeys } from "@/queries/auth";

/**
 * US-009 — self-service profile mutations. Each invalidates
 * `authKeys.me` so the AppHeader avatar + UserMenu trigger reflect
 * server state without a manual refetch.
 */

export function useUpdateMyProfile(): UseMutationResult<AuthUser, Error, UpdateMyProfileRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const res = await apiFetch<AuthUser>("/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useChangePassword(): UseMutationResult<void, Error, ChangePasswordRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      await apiFetch<void>("/me/password", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      // Other devices were kicked server-side; refresh session probe just
      // in case the current sid metadata changes (no-op locally if not).
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

interface UploadAvatarResponse {
  avatarUrl: string;
}

export function useUploadAvatar(): UseMutationResult<UploadAvatarResponse, Error, File> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch<UploadAvatarResponse>("/me/avatar", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

/** US-019 — upload cover image for own profile. Invalidates auth.me. */
interface UploadCoverResponse {
  coverUrl: string;
}

export function useUploadMyCover(): UseMutationResult<UploadCoverResponse, Error, File> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch<UploadCoverResponse>("/me/cover", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

/** US-009 delete amend — clear avatar (Cloudinary destroy + DB null). */
export function useDeleteAvatar(): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiFetch<void>("/me/avatar", { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

/** US-019 delete amend — clear profile cover. */
export function useDeleteMyCover(): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiFetch<void>("/me/cover", { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}
