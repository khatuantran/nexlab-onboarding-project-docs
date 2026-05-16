import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { FeatureDetailPage } from "@/pages/FeatureDetailPage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function buildSections(overrides: Partial<Record<string, string>> = {}) {
  const types = ["business", "user-flow", "business-rules", "tech-notes", "screenshots"] as const;
  return types.map((type) => ({
    type,
    body: overrides[type] ?? "",
    updatedAt: "2026-04-23T09:00:00Z",
    updatedBy: null,
  }));
}

function renderDetail(slug = "demo", featureSlug = "login-with-email") {
  return renderWithRouter(
    <Routes>
      <Route path="/projects/:slug/features/:featureSlug" element={<FeatureDetailPage />} />
      <Route path="/projects/:slug" element={<div data-testid="landing-marker">Landing</div>} />
    </Routes>,
    [`/projects/${slug}/features/${featureSlug}`],
  );
}

describe("FeatureDetailPage", () => {
  it("renders 5 section headings in SECTION_ORDER with markdown bodies", async () => {
    server.use(
      http.get(`${BASE}/projects/demo/features/login-with-email`, () =>
        HttpResponse.json(
          {
            data: {
              feature: {
                id: "f-1",
                slug: "login-with-email",
                title: "Đăng nhập bằng email",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T09:00:00Z",
              },
              sections: buildSections({
                business: "User dùng email + password để đăng nhập.",
                "user-flow": "# Bước 1\nNhập email",
                "business-rules": "**Phải có @.**",
                "tech-notes": "",
                screenshots: "Chưa có ảnh",
              }),
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderDetail();

    expect(
      await screen.findByRole("heading", { name: /đăng nhập bằng email/i, level: 1 }),
    ).toBeInTheDocument();

    const h2Headings = screen.getAllByRole("heading", { level: 2 });
    const labels = h2Headings.map((h) => h.textContent);
    expect(labels).toEqual([
      "Nghiệp vụ",
      "User flow",
      "Business rules",
      "Tech notes",
      "Screenshots",
    ]);
  });

  it("renders dashed placeholder for empty sections (AC-6)", async () => {
    server.use(
      http.get(`${BASE}/projects/demo/features/login-with-email`, () =>
        HttpResponse.json(
          {
            data: {
              feature: {
                id: "f-1",
                slug: "login-with-email",
                title: "Login",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T09:00:00Z",
              },
              sections: buildSections({ business: "filled" }),
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderDetail();

    await screen.findByRole("heading", { name: /login/i, level: 1 });
    // 4 empty sections → 4 placeholders
    const placeholders = screen.getAllByText(/chưa có nội dung/i);
    expect(placeholders.length).toBe(4);
  });

  it("sanitizes <script> injected in section body (XSS)", async () => {
    server.use(
      http.get(`${BASE}/projects/demo/features/login-with-email`, () =>
        HttpResponse.json(
          {
            data: {
              feature: {
                id: "f-1",
                slug: "login-with-email",
                title: "Login",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T09:00:00Z",
              },
              sections: buildSections({
                business: "before<script>window.__pwned=true</script>after",
              }),
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderDetail();

    await screen.findByRole("heading", { name: /login/i, level: 1 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).__pwned).toBeUndefined();
    expect(document.querySelector("script")).toBeNull();
  });

  it("renders 404 panel when feature not found", async () => {
    server.use(
      http.get(`${BASE}/projects/demo/features/no-such`, () =>
        HttpResponse.json(
          { error: { code: "FEATURE_NOT_FOUND", message: "Feature không tồn tại" } },
          { status: 404 },
        ),
      ),
    );

    renderDetail("demo", "no-such");

    expect(await screen.findByText(/không tìm thấy feature "no-such"/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /về project/i })).toBeInTheDocument();
  });

  it("renders breadcrumb with project + feature", async () => {
    server.use(
      http.get(`${BASE}/projects/demo/features/login-with-email`, () =>
        HttpResponse.json(
          {
            data: {
              feature: {
                id: "f-1",
                slug: "login-with-email",
                title: "Đăng nhập bằng email",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T09:00:00Z",
              },
              sections: buildSections(),
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderDetail();

    const crumb = await screen.findByRole("navigation", { name: /breadcrumb/i });
    expect(within(crumb).getByRole("link", { name: /projects/i })).toBeInTheDocument();
    expect(within(crumb).getByRole("link", { name: /^demo$/i })).toBeInTheDocument();
    expect(within(crumb).getByText(/đăng nhập bằng email/i)).toBeInTheDocument();
  });

  it("US-013: renders PR as <a> when prUrl set", async () => {
    server.use(
      http.get(`${BASE}/projects/demo/features/login-with-email`, () =>
        HttpResponse.json(
          {
            data: {
              feature: {
                id: "f-1",
                slug: "login-with-email",
                title: "Login",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T09:00:00Z",
                contributors: [],
                prUrl: "https://github.com/foo/bar/pull/42",
              },
              sections: buildSections(),
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderDetail();

    const prLink = await screen.findByRole("link", { name: /xem pr trong tab mới/i });
    expect(prLink).toHaveAttribute("href", "https://github.com/foo/bar/pull/42");
    expect(prLink).toHaveAttribute("target", "_blank");
  });

  it("US-013: renders disabled PR button when prUrl null", async () => {
    server.use(
      http.get(`${BASE}/projects/demo/features/login-with-email`, () =>
        HttpResponse.json(
          {
            data: {
              feature: {
                id: "f-1",
                slug: "login-with-email",
                title: "Login",
                createdAt: "2026-04-20T10:00:00Z",
                updatedAt: "2026-04-23T09:00:00Z",
                contributors: [],
                prUrl: null,
              },
              sections: buildSections(),
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderDetail();

    const prBtn = await screen.findByRole("button", { name: /chưa link pr/i });
    expect(prBtn).toBeDisabled();
  });
});
