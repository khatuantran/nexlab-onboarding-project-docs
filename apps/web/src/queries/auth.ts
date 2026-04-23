import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { AuthUser, LoginRequest } from "@onboarding/shared";
import { apiFetch, ApiError } from "@/lib/api";

export const authKeys = {
  me: ["auth", "me"] as const,
};

interface MeResponse {
  user: AuthUser;
}

/**
 * Fetch current session. 401 is NOT an error the UI should retry —
 * RequireAuth treats it as "not logged in" and redirects. Other errors
 * bubble up so the error boundary can surface them.
 */
export function useMe(): UseQueryResult<MeResponse | null, Error> {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await apiFetch<MeResponse>("/auth/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogin(): UseMutationResult<MeResponse, Error, LoginRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) =>
      apiFetch<MeResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.me, data);
    },
  });
}

export function useLogout(): UseMutationResult<null, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiFetch("/auth/logout", { method: "POST", raw: true });
      return null;
    },
    onSuccess: () => {
      qc.setQueryData(authKeys.me, null);
      qc.removeQueries({ queryKey: authKeys.me, exact: false });
    },
  });
}
