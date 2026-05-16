import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { ProjectLandingPage } from "@/pages/ProjectLandingPage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function renderLanding(slug = "demo") {
  return renderWithRouter(
    <Routes>
      <Route path="/projects/:slug" element={<ProjectLandingPage />} />
      <Route path="/" element={<div data-testid="home-marker">Home</div>} />
    </Routes>,
    [`/projects/${slug}`],
  );
}

describe("ProjectLandingPage", () => {
  it("renders project name + feature cards with filledCount", async () => {
    server.use(
      http.get(`${BASE}/projects/demo`, () =>
        HttpResponse.json(
          {
            data: {
              project: {
                id: "p-1",
                slug: "demo",
                name: "Demo Project",
                description: "Onboarding demo",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T10:00:00Z",
              },
              features: [
                {
                  id: "f-1",
                  slug: "login-with-email",
                  title: "Đăng nhập bằng email",
                  filledCount: 5,
                  updatedAt: "2026-04-23T09:00:00Z",
                },
                {
                  id: "f-2",
                  slug: "export-report",
                  title: "Xuất báo cáo",
                  filledCount: 2,
                  updatedAt: "2026-04-22T09:00:00Z",
                },
              ],
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderLanding();

    expect(await screen.findByRole("heading", { name: /demo project/i })).toBeInTheDocument();

    const loginCard = screen.getByRole("link", {
      name: /xem chi tiết feature đăng nhập bằng email/i,
    });
    // v4.4 FeatureCard: title in gradient header + section dots (no pct ring).
    expect(within(loginCard).getByText(/đăng nhập bằng email/i)).toBeInTheDocument();
    expect(loginCard.querySelector("time")).not.toBeNull();

    const exportCard = screen.getByRole("link", { name: /xem chi tiết feature xuất báo cáo/i });
    expect(within(exportCard).getByText(/xuất báo cáo/i)).toBeInTheDocument();
  });

  it("US-013: renders Repo as <a> when repoUrl set, disabled <button> when null", async () => {
    server.use(
      http.get(`${BASE}/projects/with-repo`, () =>
        HttpResponse.json(
          {
            data: {
              project: {
                id: "p-1",
                slug: "with-repo",
                name: "Repo Project",
                description: "",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T10:00:00Z",
                contributors: [],
                repoUrl: "https://github.com/foo/bar",
              },
              features: [],
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderLanding("with-repo");

    const repoLink = await screen.findByRole("link", { name: /mở repo trong tab mới/i });
    expect(repoLink).toHaveAttribute("href", "https://github.com/foo/bar");
    expect(repoLink).toHaveAttribute("target", "_blank");
    expect(repoLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("US-013: renders disabled Repo button when repoUrl null", async () => {
    server.use(
      http.get(`${BASE}/projects/no-repo`, () =>
        HttpResponse.json(
          {
            data: {
              project: {
                id: "p-2",
                slug: "no-repo",
                name: "No Repo",
                description: "",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T10:00:00Z",
                contributors: [],
                repoUrl: null,
              },
              features: [],
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderLanding("no-repo");

    const repoBtn = await screen.findByRole("button", { name: /chưa link repo/i });
    expect(repoBtn).toBeDisabled();
  });

  it("BUG-006 v2: Pilot hero chip uses text-orange-100 for dark-mode readability", async () => {
    server.use(
      http.get(`${BASE}/projects/demo`, () =>
        HttpResponse.json(
          {
            data: {
              project: {
                id: "p-1",
                slug: "demo",
                name: "Demo Project",
                description: null,
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-20T10:00:00Z",
              },
              features: [],
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderLanding();

    const chip = await screen.findByText(/^Pilot$/);
    const cls = chip.className;
    expect(cls).toContain("text-orange-100");
    expect(cls).not.toContain("text-[#FFD092]");
    expect(cls).not.toContain("text-orange-200");
  });

  it("renders empty state when features is empty (AC-4)", async () => {
    server.use(
      http.get(`${BASE}/projects/demo`, () =>
        HttpResponse.json(
          {
            data: {
              project: {
                id: "p-1",
                slug: "demo",
                name: "Demo Project",
                description: null,
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-20T10:00:00Z",
              },
              features: [],
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderLanding();

    expect(await screen.findByText(/chưa có feature nào trong project này/i)).toBeInTheDocument();
  });

  it("renders 404 panel when project slug is unknown", async () => {
    server.use(
      http.get(`${BASE}/projects/nope`, () =>
        HttpResponse.json(
          { error: { code: "PROJECT_NOT_FOUND", message: "Project không tồn tại" } },
          { status: 404 },
        ),
      ),
    );

    renderLanding("nope");

    expect(await screen.findByText(/không tìm thấy project "nope"/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /về trang chủ/i })).toBeInTheDocument();
  });
});
