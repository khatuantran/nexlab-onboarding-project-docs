import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import type { ProjectSummary } from "@onboarding/shared";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

const project: ProjectSummary = {
  id: "p-1",
  slug: "pilot",
  name: "Pilot Project",
  description: "MVP v1",
  featureCount: 1,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
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
      <Route path="/" element={<ProjectCard project={project} />} />
      <Route path="/projects/:slug" element={<div data-testid="project-marker">Project</div>} />
    </Routes>,
    ["/"],
  );
}

/**
 * CR-006 v3 note: ProjectCard rewritten as graphics-rich banner card.
 * No ChevronRight (eliminated per "ít chữ nhiều hình"); navigation
 * affordance is whole-card Link wrap. Admin overflow menu now overlays
 * the banner (top-right, white/15 backdrop chip).
 */
describe("ProjectCard — admin vs author affordance (BUG-004)", () => {
  it("admin: renders overflow menu on banner", async () => {
    mockMe("admin");
    renderCard();
    expect(await screen.findByRole("button", { name: /thao tác project/i })).toBeInTheDocument();
  });

  it("author: hides overflow menu, link wraps full card", async () => {
    mockMe("author");
    renderCard();
    // Wait for /me to resolve so the conditional render settles.
    await screen.findByRole("link", { name: /xem chi tiết dự án pilot project/i });
    expect(screen.queryByRole("button", { name: /thao tác project/i })).toBeNull();
  });
});
