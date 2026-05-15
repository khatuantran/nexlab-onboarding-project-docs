import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "@/components/layout/AppHeader";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function mockMe(role: "admin" | "author" = "author") {
  server.use(
    http.get(`${BASE}/auth/me`, () =>
      HttpResponse.json(
        {
          data: {
            user: {
              id: "u-1",
              email: "u@b",
              displayName: "Tester",
              role,
              avatarUrl: null,
              lastLoginAt: null,
              createdAt: new Date().toISOString(),
            },
          },
        },
        { status: 200 },
      ),
    ),
  );
}

describe("UserMenu — Hồ sơ của tôi navigation (US-009 AC-1)", () => {
  it("renders an enabled 'Hồ sơ của tôi' link to /profile (not disabled placeholder)", async () => {
    mockMe("author");
    renderWithRouter(<AppHeader />, ["/"]);
    const user = userEvent.setup();
    const trigger = await screen.findByRole("button", { name: /tài khoản tester/i });
    await user.click(trigger);
    const item = await screen.findByRole("menuitem", { name: /hồ sơ của tôi/i });
    // Disabled placeholder used to render with "Sắp ra mắt" — must be gone.
    expect(item).not.toHaveAttribute("data-disabled");
    // With Radix `asChild`, the menuitem role is on the <a> itself.
    expect(item.tagName).toBe("A");
    expect(item.getAttribute("href")).toBe("/profile");
  });
});
