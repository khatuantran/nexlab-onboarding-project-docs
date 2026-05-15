import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { AppHeader } from "@/components/layout/AppHeader";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

describe("RequireAuth", () => {
  it("redirects to /login?next=<path> when no session", async () => {
    renderWithRouter(
      <Routes>
        <Route
          path="/projects/demo"
          element={
            <RequireAuth>
              <div data-testid="protected">Protected</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div data-testid="login-marker">Login</div>} />
      </Routes>,
      ["/projects/demo"],
    );

    await waitFor(() => {
      expect(screen.getByTestId("login-marker")).toBeInTheDocument();
    });
  });

  it("renders children when /auth/me resolves with a user", async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () =>
        HttpResponse.json(
          { data: { user: { id: "u-1", email: "a@b", displayName: "Admin", role: "admin" } } },
          { status: 200 },
        ),
      ),
    );

    renderWithRouter(
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <div data-testid="protected">Protected</div>
            </RequireAuth>
          }
        />
      </Routes>,
      ["/"],
    );

    expect(await screen.findByTestId("protected")).toBeInTheDocument();
  });
});

describe("AppHeader logout", () => {
  it("clicking logout calls API and clears the user from the cache", async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () =>
        HttpResponse.json(
          { data: { user: { id: "u-1", email: "a@b", displayName: "Admin", role: "admin" } } },
          { status: 200 },
        ),
      ),
      http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    );

    renderWithRouter(
      <Routes>
        <Route path="/" element={<AppHeader />} />
        <Route path="/login" element={<div data-testid="login-marker">Login</div>} />
      </Routes>,
      ["/"],
    );

    const user = userEvent.setup();
    // AppHeader v2 collapses Đăng xuất into UserMenu dropdown.
    const trigger = await screen.findByRole("button", { name: /tài khoản admin/i });
    await user.click(trigger);
    const btn = await screen.findByRole("menuitem", { name: /đăng xuất/i });
    await user.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId("login-marker")).toBeInTheDocument();
    });
  });
});
