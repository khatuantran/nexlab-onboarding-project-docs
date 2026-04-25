import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface UserListItem {
  id: string;
  displayName: string;
  role: "admin" | "author";
}

export interface UseUsersArgs {
  q?: string;
  role?: "admin" | "author";
}

export const usersKeys = {
  list: (args: UseUsersArgs) => ["users", args.q ?? null, args.role ?? null] as const,
};

/**
 * US-005 / FR-USER-001 — backs the AuthorPicker combobox in the search
 * filter bar. Backend caps at 50; v1 has no pagination so a client-side
 * search-as-you-type covers the cardinality the pilot needs.
 */
export function useUsers(args: UseUsersArgs = {}): UseQueryResult<UserListItem[], Error> {
  const params = new URLSearchParams();
  if (args.q && args.q.trim().length > 0) params.set("q", args.q.trim());
  if (args.role) params.set("role", args.role);
  const qs = params.toString();
  const path = qs.length > 0 ? `/users?${qs}` : "/users";

  return useQuery({
    queryKey: usersKeys.list(args),
    queryFn: () => apiFetch<UserListItem[]>(path),
    retry: false,
  });
}
