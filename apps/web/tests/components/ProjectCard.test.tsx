import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
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
  featureCount: 3,
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
 * CR-006 v3.1 ProjectCard rich tile per user mockup 2026-05-16.
 * Full-color tile with category tag + big % + decorative circles +
 * sections counter + avatar stack + relative time. Admin gets overflow
 * menu in lieu of Live indicator.
 */
describe("ProjectCard — rich tile (v3.1)", () => {
  it("renders category tag, big %, sections counter, avatar stack", async () => {
    mockMe("author");
    renderCard();
    const link = await screen.findByRole("link", { name: /xem chi tiết dự án pilot project/i });

    // Category tag from one of 6 fixed labels (deterministic from slug hash).
    const categoryTag = within(link).getByText(/^(E2E|Backend|Search|Payment|CRM|Admin)$/);
    expect(categoryTag).toBeInTheDocument();

    // Big % display — 0/20/40/60/80/100 cycle.
    expect(within(link).getByText(/^\d+%$/)).toBeInTheDocument();
    expect(within(link).getByText(/^doc$/i)).toBeInTheDocument();

    // Sections counter + feature count.
    expect(within(link).getByText(/\d+\/15 sections · 3 features/)).toBeInTheDocument();

    // Relative time semantic element.
    expect(link.querySelector("time")).not.toBeNull();
  });

  it("admin: renders overflow menu, hides Live indicator", async () => {
    mockMe("admin");
    renderCard();
    expect(await screen.findByRole("button", { name: /thao tác project/i })).toBeInTheDocument();
    expect(screen.queryByText(/^Live$/)).toBeNull();
  });

  it("author with featureCount > 0: renders Live indicator, hides overflow menu", async () => {
    mockMe("author");
    renderCard();
    await screen.findByRole("link", { name: /xem chi tiết dự án pilot project/i });
    expect(screen.queryByRole("button", { name: /thao tác project/i })).toBeNull();
    expect(screen.getByText(/^Live$/)).toBeInTheDocument();
  });
});
