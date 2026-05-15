import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useChangePassword, useUpdateMyProfile, useUploadAvatar } from "@/queries/me";
import { authKeys } from "@/queries/auth";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("me mutations — cache invalidation (US-009)", () => {
  it("useUpdateMyProfile invalidates authKeys.me after PATCH 200", async () => {
    server.use(
      http.patch(`${BASE}/me`, () =>
        HttpResponse.json(
          {
            data: {
              id: "u-1",
              email: "a@b",
              displayName: "Renamed",
              role: "author",
              avatarUrl: null,
              lastLoginAt: null,
              createdAt: new Date().toISOString(),
            },
          },
          { status: 200 },
        ),
      ),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(authKeys.me, { stale: true });
    const { result } = renderHook(() => useUpdateMyProfile(), { wrapper: wrapper(qc) });
    result.current.mutate({ displayName: "Renamed" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(qc.getQueryState(authKeys.me)?.isInvalidated).toBe(true);
  });

  it("useChangePassword invalidates authKeys.me after 204", async () => {
    server.use(http.post(`${BASE}/me/password`, () => new HttpResponse(null, { status: 204 })));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(authKeys.me, { stale: true });
    const { result } = renderHook(() => useChangePassword(), { wrapper: wrapper(qc) });
    result.current.mutate({ oldPassword: "old123456", newPassword: "new12345678" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(qc.getQueryState(authKeys.me)?.isInvalidated).toBe(true);
  });

  it("useUploadAvatar posts FormData and invalidates authKeys.me", async () => {
    server.use(
      http.post(`${BASE}/me/avatar`, () =>
        HttpResponse.json(
          { data: { avatarUrl: "https://res.cloudinary.com/test/x.png" } },
          { status: 200 },
        ),
      ),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(authKeys.me, { stale: true });
    const { result } = renderHook(() => useUploadAvatar(), { wrapper: wrapper(qc) });
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "a.png", {
      type: "image/png",
    });
    result.current.mutate(file);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.avatarUrl).toMatch(/res\.cloudinary\.com/);
    expect(qc.getQueryState(authKeys.me)?.isInvalidated).toBe(true);
  });
});
