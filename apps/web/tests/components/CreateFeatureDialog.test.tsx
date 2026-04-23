import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route, useLocation } from "react-router-dom";
import { ProjectLandingPage } from "@/pages/ProjectLandingPage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function mockSession(role: "admin" | "author" | null) {
  server.use(
    http.get(`${BASE}/auth/me`, () =>
      role
        ? HttpResponse.json(
            { data: { user: { id: "u-1", email: "a@b", displayName: "A", role } } },
            { status: 200 },
          )
        : HttpResponse.json({ error: { code: "UNAUTHENTICATED", message: "" } }, { status: 401 }),
    ),
    http.get(`${BASE}/projects/pilot`, () =>
      HttpResponse.json(
        {
          data: {
            project: {
              id: "p-1",
              slug: "pilot",
              name: "Pilot",
              description: null,
              createdAt: "2026-04-23T00:00:00Z",
              updatedAt: "2026-04-23T00:00:00Z",
            },
            features: [],
          },
        },
        { status: 200 },
      ),
    ),
  );
}

function renderLanding() {
  renderWithRouter(
    <Routes>
      <Route path="/projects/:slug" element={<ProjectLandingPage />} />
      <Route path="/projects/:slug/features/:featureSlug" element={<LocationProbe />} />
    </Routes>,
    ["/projects/pilot"],
  );
}

describe("CreateFeatureDialog — author gate on ProjectLandingPage", () => {
  it("admin sees 'Thêm feature' trigger", async () => {
    mockSession("admin");
    renderLanding();
    expect(await screen.findByRole("button", { name: /thêm feature/i })).toBeInTheDocument();
  });

  it("author sees 'Thêm feature' trigger", async () => {
    mockSession("author");
    renderLanding();
    expect(await screen.findByRole("button", { name: /thêm feature/i })).toBeInTheDocument();
  });

  it("unauthenticated user does not see trigger", async () => {
    mockSession(null);
    renderLanding();
    await screen.findByRole("heading", { name: /pilot/i });
    expect(screen.queryByRole("button", { name: /thêm feature/i })).toBeNull();
  });
});

describe("CreateFeatureDialog — form behavior", () => {
  it("auto-derives slug from title (strip diacritics)", async () => {
    mockSession("admin");
    renderLanding();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /thêm feature/i }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText(/tiêu đề/i), "Đăng nhập bằng email");
    const slugInput = within(dialog).getByLabelText(/^slug/i) as HTMLInputElement;
    await waitFor(() => {
      expect(slugInput.value).toBe("dang-nhap-bang-email");
    });
  });

  it("navigates to feature detail on 201", async () => {
    mockSession("admin");
    server.use(
      http.post(`${BASE}/projects/pilot/features`, async ({ request }) => {
        const body = (await request.json()) as { slug: string; title: string };
        return HttpResponse.json(
          {
            data: {
              id: "f-1",
              slug: body.slug,
              title: body.title,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        );
      }),
    );

    renderLanding();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /thêm feature/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/tiêu đề/i), "Login");
    await user.click(within(dialog).getByRole("button", { name: /^tạo feature$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("loc").textContent).toBe("/projects/pilot/features/login");
    });
  });

  it("shows inline error on 409 FEATURE_SLUG_TAKEN", async () => {
    mockSession("admin");
    server.use(
      http.post(`${BASE}/projects/pilot/features`, () =>
        HttpResponse.json(
          { error: { code: "FEATURE_SLUG_TAKEN", message: "Slug đã được dùng" } },
          { status: 409 },
        ),
      ),
    );

    renderLanding();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /thêm feature/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/tiêu đề/i), "Dup");
    await user.click(within(dialog).getByRole("button", { name: /^tạo feature$/i }));

    expect(await within(dialog).findByText(/slug đã được dùng/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
