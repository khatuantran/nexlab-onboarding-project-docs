import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  AdminUser,
  InviteUserRequest,
  InviteUserResponse,
  UpdateUserRequest,
} from "@onboarding/shared";
import { apiFetch } from "@/lib/api";

export interface UserListItem {
  id: string;
  displayName: string;
  role: "admin" | "author";
}

export type AdminListStatus = "active" | "archived" | "all";

export interface UseUsersArgs {
  q?: string;
  role?: "admin" | "author";
}

export interface UseAdminUsersArgs extends UseUsersArgs {
  status?: AdminListStatus;
}

export const usersKeys = {
  list: (args: UseUsersArgs) => ["users", args.q ?? null, args.role ?? null] as const,
  admin: (args: UseAdminUsersArgs) =>
    ["users-admin", args.q ?? null, args.role ?? null, args.status ?? "active"] as const,
};

function buildQs(args: UseAdminUsersArgs): string {
  const params = new URLSearchParams();
  if (args.q && args.q.trim().length > 0) params.set("q", args.q.trim());
  if (args.role) params.set("role", args.role);
  if (args.status) params.set("status", args.status);
  const qs = params.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

/**
 * US-005 / FR-USER-001 — backs the AuthorPicker combobox. Backend caps
 * at 100; pilot has no pagination.
 */
export function useUsers(args: UseUsersArgs = {}): UseQueryResult<UserListItem[], Error> {
  return useQuery({
    queryKey: usersKeys.list(args),
    queryFn: () => apiFetch<UserListItem[]>(`/users${buildQs(args)}`),
    retry: false,
  });
}

/**
 * US-007 — admin variant; returns the full AdminUser shape (+email,
 * archivedAt, lastLoginAt). The component is responsible for gating
 * usage behind <AdminGate>.
 */
export function useAdminUsers(args: UseAdminUsersArgs = {}): UseQueryResult<AdminUser[], Error> {
  return useQuery({
    queryKey: usersKeys.admin(args),
    queryFn: () => apiFetch<AdminUser[]>(`/users${buildQs(args)}`),
    retry: false,
  });
}

function invalidateAdminLists(qc: ReturnType<typeof useQueryClient>): void {
  qc.invalidateQueries({ queryKey: ["users-admin"] });
  qc.invalidateQueries({ queryKey: ["users"] });
}

export function useInviteUser(): UseMutationResult<InviteUserResponse, Error, InviteUserRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      apiFetch<InviteUserResponse>("/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidateAdminLists(qc),
  });
}

export interface UpdateUserArgs {
  id: string;
  patch: UpdateUserRequest;
}

export function useUpdateUser(): UseMutationResult<AdminUser, Error, UpdateUserArgs> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) =>
      apiFetch<AdminUser>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => invalidateAdminLists(qc),
  });
}

export function useArchiveUser(): UseMutationResult<AdminUser, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch<AdminUser>(`/users/${id}/archive`, { method: "POST" }),
    onSuccess: () => invalidateAdminLists(qc),
  });
}

export function useUnarchiveUser(): UseMutationResult<AdminUser, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch<AdminUser>(`/users/${id}/unarchive`, { method: "POST" }),
    onSuccess: () => invalidateAdminLists(qc),
  });
}

export function useResetUserPassword(): UseMutationResult<InviteUserResponse, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiFetch<InviteUserResponse>(`/users/${id}/reset-password`, { method: "POST" }),
    onSuccess: () => invalidateAdminLists(qc),
  });
}
