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
};

const demo: ProjectSummary = {
  id: "p-2",
  slug: "demo",
  name: "Demo Project",
  description: "Sandbox cho dev mới onboard.",
  featureCount: 1,
  createdAt: "2026-04-18T10:00:00Z",
  updatedAt: "2026-04-22T10:00:00Z",
};

describe("HomePage", () => {
  it("renders project rows with name, description, featureCount, relative time", async () => {
    mockMe("author");
    mockProjects([pilot, demo]);
    renderHome();

    expect(await screen.findByRole("heading", { name: /^workspace$/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /dự án của bạn/i })).toBeInTheDocument();
    const pilotLink = await screen.findByRole("link", { name: /xem chi tiết project pilot/i });
    expect(within(pilotLink).getByText("Pilot Project")).toBeInTheDocument();
    expect(within(pilotLink).getByText(/5 features?/)).toBeInTheDocument();
    expect(pilotLink.querySelector("time")).not.toBeNull();

    const demoLink = screen.getByRole("link", { name: /xem chi tiết project demo/i });
    expect(within(demoLink).getByText(/1 feature$/)).toBeInTheDocument();
  });

  it("shows empty state with admin CTA 'Tạo project đầu tiên'", async () => {
    mockMe("admin");
    mockProjects([]);
    renderHome();

    expect(await screen.findByText(/chưa có project nào/i)).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /tạo project đầu tiên/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state without CTA for author role", async () => {
    mockMe("author");
    mockProjects([]);
    renderHome();

    expect(await screen.findByText(/chưa có project nào/i)).toBeInTheDocument();
    expect(await screen.findByText(/liên hệ admin/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tạo project/i })).toBeNull();
  });

  it("row click navigates to /projects/:slug", async () => {
    const user = userEvent.setup();
    mockMe("author");
    mockProjects([pilot]);
    renderHome();

    const link = await screen.findByRole("link", { name: /xem chi tiết project pilot/i });
    await user.click(link);
    expect(await screen.findByTestId("project-page")).toBeInTheDocument();
  });

  it("admin empty-state CTA opens CreateProjectDialog", async () => {
    const user = userEvent.setup();
    mockMe("admin");
    mockProjects([]);
    renderHome();

    const cta = await screen.findByRole("button", { name: /tạo project đầu tiên/i });
    await user.click(cta);
    expect(await screen.findByRole("dialog", { name: /tạo project/i })).toBeInTheDocument();
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
