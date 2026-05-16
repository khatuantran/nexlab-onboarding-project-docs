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
 * CR-006 v4 ProjectCard — gradient header (1 of 6 vivid palettes) +
 * initials plate + tag pill + Live pill or admin overflow +
 * ProgressRing + light body with title + section dots + bottom row
 * (AvatarStack + features count + activity).
 */
describe("ProjectCard — v4 vivid gradient header", () => {
  it("renders initials plate, category tag, section dots, features counter", async () => {
    mockMe("author");
    renderCard();
    const link = await screen.findByRole("link", { name: /xem chi tiết dự án pilot project/i });

    // Initials plate — 2-letter uppercase from first word.
    expect(within(link).getByText(/^PI$/)).toBeInTheDocument();

    // Category tag from one of 6 fixed labels (deterministic by slug hash).
    expect(within(link).getByText(/^(E2E|Backend|Search|Payment|CRM|Admin)$/)).toBeInTheDocument();

    // Features compact counter "3f" in bottom row.
    expect(within(link).getByText(/^3f$/i)).toBeInTheDocument();

    // RelativeTime element.
    expect(link.querySelector("time")).not.toBeNull();
  });

  it("admin: renders overflow menu in top-right of header", async () => {
    mockMe("admin");
    renderCard();
    expect(await screen.findByRole("button", { name: /thao tác project/i })).toBeInTheDocument();
  });

  it("author with featureCount > 0: renders Live indicator, hides overflow menu", async () => {
    mockMe("author");
    renderCard();
    await screen.findByRole("link", { name: /xem chi tiết dự án pilot project/i });
    expect(screen.queryByRole("button", { name: /thao tác project/i })).toBeNull();
    expect(screen.getByText(/^Live$/)).toBeInTheDocument();
  });
});
