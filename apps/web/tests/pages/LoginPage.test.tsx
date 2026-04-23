import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function renderLogin(path = "/login") {
  return renderWithRouter(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div data-testid="home-marker">Home</div>} />
      <Route path="/projects/demo" element={<div data-testid="next-marker">Demo</div>} />
    </Routes>,
    [path],
  );
}

describe("LoginPage", () => {
  it("renders email + password inputs and submit button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it("shows Zod validation error when submitting an empty form", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }));
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
  });

  it("redirects to `/` after a successful login", async () => {
    server.use(
      http.post(`${BASE}/auth/login`, async () =>
        HttpResponse.json(
          {
            data: {
              user: {
                id: "u-1",
                email: "admin@local",
                displayName: "Admin",
                role: "admin",
              },
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "admin@local");
    await user.type(screen.getByLabelText(/mật khẩu/i), "dev12345");
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByTestId("home-marker")).toBeInTheDocument();
    });
  });

  it("redirects to the `next` query param after successful login", async () => {
    server.use(
      http.post(`${BASE}/auth/login`, async () =>
        HttpResponse.json(
          {
            data: {
              user: { id: "u-1", email: "a@b", displayName: "A", role: "author" },
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderLogin("/login?next=%2Fprojects%2Fdemo");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "a@b");
    await user.type(screen.getByLabelText(/mật khẩu/i), "x");
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByTestId("next-marker")).toBeInTheDocument();
    });
  });

  it("shows mapped error copy when the API returns INVALID_CREDENTIALS", async () => {
    server.use(
      http.post(`${BASE}/auth/login`, async () =>
        HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "nope" } },
          { status: 401 },
        ),
      ),
    );

    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "admin@local");
    await user.type(screen.getByLabelText(/mật khẩu/i), "wrong");
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }));

    expect(await screen.findByText(/email hoặc mật khẩu không đúng/i)).toBeInTheDocument();
  });
});
