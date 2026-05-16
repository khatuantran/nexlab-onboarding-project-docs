import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import type { FeatureListItem } from "@onboarding/shared";
import { FeatureCard } from "@/components/features/FeatureCard";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

const feature: FeatureListItem = {
  id: "f-1",
  slug: "dang-nhap",
  title: "Đăng nhập",
  filledCount: 2,
  updatedAt: new Date().toISOString(),
  contributors: [],
  prUrl: null,
};

function mockMe(role: "admin" | "author") {
  server.use(
    http.get(`${BASE}/auth/me`, () =>
      HttpResponse.json(
        { data: { user: { id: "u-1", email: "a@b", displayName: "Tester", role } } },
        { status: 200 },
      ),
    ),
  );
}

function renderCard() {
  return renderWithRouter(
    <Routes>
      <Route
        path="/projects/:slug"
        element={<FeatureCard projectSlug="pilot" feature={feature} />}
      />
      <Route
        path="/projects/:slug/features/:fSlug"
        element={<div data-testid="feature-marker">Feature detail</div>}
      />
    </Routes>,
    ["/projects/pilot"],
  );
}

describe("FeatureCard — admin vs author affordance (US-008, BUG-004 contract)", () => {
  it("admin: renders overflow menu (v4 gradient header, no ChevronRight)", async () => {
    mockMe("admin");
    const { container } = renderCard();
    expect(await screen.findByRole("button", { name: /thao tác feature/i })).toBeInTheDocument();
    // v4: no chevron in either role — affordance is whole-card hover.
    expect(container.querySelector("svg.lucide-chevron-right")).toBeNull();
  });

  it("author: hides overflow menu (whole-card hover affordance, no chevron)", async () => {
    mockMe("author");
    const { container } = renderCard();
    await screen.findByRole("link", { name: /xem chi tiết feature đăng nhập/i });
    expect(screen.queryByRole("button", { name: /thao tác feature/i })).toBeNull();
    expect(container.querySelector("svg.lucide-chevron-right")).toBeNull();
  });
});
