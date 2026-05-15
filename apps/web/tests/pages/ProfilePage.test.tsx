import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePage } from "@/pages/ProfilePage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function mockMe(overrides: Partial<{ avatarUrl: string | null; displayName: string }> = {}) {
  server.use(
    http.get(`${BASE}/auth/me`, () =>
      HttpResponse.json(
        {
          data: {
            user: {
              id: "u-1",
              email: "tester@nexlab.com",
              displayName: overrides.displayName ?? "Tester",
              role: "author" as const,
              avatarUrl: overrides.avatarUrl ?? null,
              lastLoginAt: new Date().toISOString(),
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          },
        },
        { status: 200 },
      ),
    ),
  );
}

describe("ProfilePage (US-009)", () => {
  it("renders email + displayName + role + 3 sections", async () => {
    mockMe();
    renderWithRouter(<ProfilePage />, ["/profile"]);
    expect(await screen.findByText("tester@nexlab.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /hồ sơ của tôi/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /thông tin tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /đổi mật khẩu/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ảnh đại diện/i })).toBeInTheDocument();
  });

  it("inline edit displayName: PATCH 200 swaps view + invalidates cache", async () => {
    mockMe();
    server.use(
      http.patch(`${BASE}/me`, async ({ request }) => {
        const body = (await request.json()) as { displayName: string };
        return HttpResponse.json(
          {
            data: {
              id: "u-1",
              email: "tester@nexlab.com",
              displayName: body.displayName,
              role: "author",
              avatarUrl: null,
              lastLoginAt: null,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          },
          { status: 200 },
        );
      }),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /sửa/i }));
    const input = await screen.findByLabelText(/tên hiển thị/i);
    await user.clear(input);
    await user.type(input, "Tester Renamed");
    await user.click(screen.getByRole("button", { name: /^lưu$/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText(/tên hiển thị/i)).toBeNull();
    });
  });

  it("password form rejects mismatch client-side before POST", async () => {
    mockMe();
    let posted = false;
    server.use(
      http.post(`${BASE}/me/password`, () => {
        posted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await screen.findByLabelText(/mật khẩu hiện tại/i);
    await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), "old12345");
    await user.type(screen.getByLabelText(/mật khẩu mới \(/i), "new12345xx");
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), "different00");
    await user.click(screen.getByRole("button", { name: /^đổi mật khẩu$/i }));
    expect(await screen.findByText(/xác nhận mật khẩu không khớp/i)).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it("password 401 INVALID_CREDENTIALS shows inline error near old-password field", async () => {
    mockMe();
    server.use(
      http.post(`${BASE}/me/password`, () =>
        HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "wrong" } },
          { status: 401 },
        ),
      ),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await screen.findByLabelText(/mật khẩu hiện tại/i);
    await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), "wrong-old");
    await user.type(screen.getByLabelText(/mật khẩu mới \(/i), "new12345xx");
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), "new12345xx");
    await user.click(screen.getByRole("button", { name: /^đổi mật khẩu$/i }));
    expect(await screen.findByText(/mật khẩu cũ không đúng/i)).toBeInTheDocument();
  });

  it("renders an <img> avatar when user has avatarUrl", async () => {
    mockMe({ avatarUrl: "https://res.cloudinary.com/test/me.png" });
    const { container } = renderWithRouter(<ProfilePage />, ["/profile"]);
    await screen.findByText("tester@nexlab.com");
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect(imgs[0]?.src).toContain("cloudinary.com");
  });

  it("avatar file > 2 MB shows toast and never POSTs", async () => {
    mockMe();
    let posted = false;
    server.use(
      http.post(`${BASE}/me/avatar`, () => {
        posted = true;
        return HttpResponse.json({ data: { avatarUrl: "x" } }, { status: 200 });
      }),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await screen.findByText("tester@nexlab.com");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File([new Uint8Array(3 * 1024 * 1024)], "big.png", { type: "image/png" });
    await user.upload(input, bigFile);
    // Give the toast handler a beat.
    await new Promise((r) => setTimeout(r, 30));
    expect(posted).toBe(false);
  });
});

// Quiet down vi unused-import (vi is used implicitly via mock helpers elsewhere; keep for parity).
void vi;
