import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import type { ProjectSummary } from "@onboarding/shared";
import { HomePage } from "@/pages/HomePage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function mockMe(role: "admin" | "author" = "admin") {
  server.use(
    http.get(`${BASE}/auth/me`, () =>
      HttpResponse.json(
        {
          data: {
            user: {
              id: "u-1",
              email: `${role}@local`,
              displayName: role === "admin" ? "Admin" : "Author",
              role,
            },
          },
        },
        { status: 200 },
      ),
    ),
  );
}

function mockProjects(data: ProjectSummary[]) {
  server.use(http.get(`${BASE}/projects`, () => HttpResponse.json({ data }, { status: 200 })));
}

function renderHome() {
  return renderWithRouter(
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:slug" element={<div data-testid="project-page">Project</div>} />
    </Routes>,
    ["/"],
  );
}

const pilot: ProjectSummary = {
  id: "p-1",
  slug: "pilot",
  name: "Pilot Project",
  description: "MVP v1 cho onboarding catalog pilot team A.",
  featureCount: 5,
  createdAt: "2026-04-20T10:00:00Z",
  updatedAt: "2026-04-23T10:00:00Z",
  contributors: [],
  repoUrl: null,
  filledSectionCount: 0,
};

const demo: ProjectSummary = {
  id: "p-2",
  slug: "demo",
  name: "Demo Project",
  description: "Sandbox cho dev mới onboard.",
  featureCount: 1,
  createdAt: "2026-04-18T10:00:00Z",
  updatedAt: "2026-04-22T10:00:00Z",
  contributors: [],
  repoUrl: null,
  filledSectionCount: 0,
};

describe("HomePage", () => {
  it("BUG-006 v2: hero Sprint chip uses text-orange-100 for dark-mode readability", async () => {
    mockMe("author");
    mockProjects([pilot]);
    renderHome();

    const chip = await screen.findByText(/Sprint 14/i);
    const cls = chip.className;
    expect(cls).toContain("text-orange-100");
    expect(cls).not.toContain("text-[#FFD092]");
    expect(cls).not.toContain("text-orange-200");
  });

  it("BUG-005: HeroStat label uses text-white/75 (not /50) for dark-mode contrast", async () => {
    mockMe("author");
    mockProjects([pilot]);
    renderHome();

    const label = await screen.findByText(/^Projects$/);
    const cls = label.className;
    expect(cls).toContain("text-white/75");
    expect(cls).not.toContain("text-white/50");
  });

  it("renders v4 dark hero, filter chip group, vivid project cards", async () => {
    mockMe("author");
    mockProjects([pilot, demo]);
    renderHome();

    // v4 hero headline "Workspace / của bạn" — h1 wraps both lines.
    expect(await screen.findByRole("heading", { name: /workspace/i })).toBeInTheDocument();

    // Floating filter bar — chip group with 4 options.
    const filterGroup = await screen.findByRole("tablist", { name: /lọc dự án/i });
    expect(within(filterGroup).getByRole("tab", { name: /tất cả/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(within(filterGroup).getByRole("tab", { name: /đang chạy/i })).toBeInTheDocument();

    // Project cards render with compact feature counts "Nf".
    const pilotLink = await screen.findByRole("link", { name: /xem chi tiết dự án pilot/i });
    expect(within(pilotLink).getByText("Pilot Project")).toBeInTheDocument();
    expect(within(pilotLink).getByText(/^5f$/i)).toBeInTheDocument();
    expect(pilotLink.querySelector("time")).not.toBeNull();

    const demoLink = screen.getByRole("link", { name: /xem chi tiết dự án demo/i });
    expect(within(demoLink).getByText(/^1f$/i)).toBeInTheDocument();
  });

  it("shows empty state with admin CTA 'Tạo dự án đầu tiên'", async () => {
    mockMe("admin");
    mockProjects([]);
    renderHome();

    expect(await screen.findByText(/chưa có dự án nào/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /tạo dự án đầu tiên/i })).toBeInTheDocument();
  });

  it("shows empty state without CTA for author role", async () => {
    mockMe("author");
    mockProjects([]);
    renderHome();

    expect(await screen.findByText(/chưa có dự án nào/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tạo dự án/i })).toBeNull();
  });

  it("row click navigates to /projects/:slug", async () => {
    const user = userEvent.setup();
    mockMe("author");
    mockProjects([pilot]);
    renderHome();

    const link = await screen.findByRole("link", { name: /xem chi tiết dự án pilot/i });
    await user.click(link);
    expect(await screen.findByTestId("project-page")).toBeInTheDocument();
  });

  it("admin empty-state CTA opens CreateProjectDialog", async () => {
    const user = userEvent.setup();
    mockMe("admin");
    mockProjects([]);
    renderHome();

    const cta = await screen.findByRole("button", { name: /tạo dự án đầu tiên/i });
    await user.click(cta);
    expect(await screen.findByRole("dialog", { name: /tạo project/i })).toBeInTheDocument();
  });

  it("floating filter bar search filters projects client-side by name + description", async () => {
    const user = userEvent.setup();
    mockMe("author");
    mockProjects([pilot, demo]);
    renderHome();

    // Both cards visible initially.
    await screen.findByRole("link", { name: /xem chi tiết dự án pilot/i });
    expect(screen.getByRole("link", { name: /xem chi tiết dự án demo/i })).toBeInTheDocument();

    const searchBox = screen.getByLabelText(/tìm dự án, owner, tag/i);
    await user.type(searchBox, "pilot");

    expect(screen.getByRole("link", { name: /xem chi tiết dự án pilot/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /xem chi tiết dự án demo/i })).toBeNull();

    // No-match state with query echo.
    await user.clear(searchBox);
    await user.type(searchBox, "không-có-gì-khớp");
    expect(screen.getByText(/không tìm thấy dự án nào khớp với/i)).toBeInTheDocument();
  });

  it("US-014: hero renders 3 real tiles from /workspace/stats", async () => {
    mockMe("author");
    mockProjects([pilot, demo]);
    server.use(
      http.get(`${BASE}/workspace/stats`, () =>
        HttpResponse.json(
          { data: { projectCount: 5, featuresDocumented: 12, contributorsActive: 3 } },
          { status: 200 },
        ),
      ),
    );
    renderHome();

    expect(await screen.findByText(/^5$/)).toBeInTheDocument();
    expect(await screen.findByText(/^12$/)).toBeInTheDocument();
    expect(await screen.findByText(/^3$/)).toBeInTheDocument();
    // Old "Onboard TB" 4th tile is gone.
    expect(screen.queryByText(/onboard tb/i)).toBeNull();
    expect(screen.getByText(/đóng góp \(30 ngày\)/i)).toBeInTheDocument();
  });

  it("US-014: 'Đủ doc' chip filters by filledSectionCount === featureCount * 5", async () => {
    const user = userEvent.setup();
    mockMe("author");
    mockProjects([
      { ...pilot, featureCount: 2, filledSectionCount: 10 },
      { ...demo, featureCount: 2, filledSectionCount: 7 },
    ]);
    renderHome();

    // Both visible initially.
    await screen.findByRole("link", { name: /xem chi tiết dự án pilot/i });
    expect(screen.getByRole("link", { name: /xem chi tiết dự án demo/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /đủ doc/i }));

    expect(screen.getByRole("link", { name: /xem chi tiết dự án pilot/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /xem chi tiết dự án demo/i })).toBeNull();
  });

  it("error state shows retry button", async () => {
    mockMe("author");
    server.use(
      http.get(`${BASE}/projects`, () =>
        HttpResponse.json({ error: { code: "INTERNAL_ERROR", message: "boom" } }, { status: 500 }),
      ),
    );
    renderHome();

    expect(await screen.findByRole("alert")).toHaveTextContent(/có lỗi xảy ra/i);
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeInTheDocument();
  });
});
