import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { FeatureDetailPage } from "@/pages/FeatureDetailPage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

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
  );
}

function mockFeature(opts: { businessBody?: string; userFlowBody?: string } = {}) {
  server.use(
    http.get(`${BASE}/projects/demo/features/login`, () =>
      HttpResponse.json(
        {
          data: {
            feature: {
              id: "f-1",
              slug: "login",
              title: "Login",
              createdAt: "2026-04-20T10:00:00Z",
              updatedAt: "2026-04-23T09:00:00Z",
            },
            sections: [
              {
                type: "business",
                body: opts.businessBody ?? "",
                updatedAt: "2026-04-23T09:00:00Z",
                updatedBy: null,
              },
              {
                type: "user-flow",
                body: opts.userFlowBody ?? "",
                updatedAt: "2026-04-23T09:00:00Z",
                updatedBy: null,
              },
              {
                type: "business-rules",
                body: "",
                updatedAt: "2026-04-23T09:00:00Z",
                updatedBy: null,
              },
              {
                type: "tech-notes",
                body: "",
                updatedAt: "2026-04-23T09:00:00Z",
                updatedBy: null,
              },
              {
                type: "screenshots",
                body: "",
                updatedAt: "2026-04-23T09:00:00Z",
                updatedBy: null,
              },
            ],
          },
        },
        { status: 200 },
      ),
    ),
  );
}

function renderDetail() {
  renderWithRouter(
    <Routes>
      <Route path="/projects/:slug/features/:featureSlug" element={<FeatureDetailPage />} />
    </Routes>,
    ["/projects/demo/features/login"],
  );
}

describe("SectionEditor — author gate + editable section list", () => {
  it("author sees 'Sửa' on business/user-flow/business-rules only", async () => {
    mockSession("author");
    mockFeature();
    renderDetail();

    // business heading renders
    await screen.findByRole("heading", { name: /nghiệp vụ/i });

    // AuthorGate depends on async /me resolution
    const editButtons = await screen.findAllByRole("button", { name: /^sửa section/i });
    expect(editButtons).toHaveLength(3);
  });

  it("unauthenticated does not see pencil button", async () => {
    mockSession(null);
    mockFeature();
    renderDetail();
    await screen.findByRole("heading", { name: /nghiệp vụ/i });
    expect(screen.queryByRole("button", { name: /^sửa/i })).toBeNull();
  });
});

describe("SectionEditor — edit → save → collapse", () => {
  it("clicking 'Sửa' opens editor with current body, save calls PUT, collapses to read", async () => {
    mockSession("admin");
    mockFeature({ businessBody: "# Original\n\nbody" });

    let putCalled = false;
    server.use(
      http.put(`${BASE}/features/f-1/sections/business`, async ({ request }) => {
        const body = (await request.json()) as { body: string };
        putCalled = true;
        return HttpResponse.json(
          {
            data: {
              type: "business",
              body: body.body,
              updatedAt: new Date().toISOString(),
              updatedBy: "u-1",
            },
          },
          { status: 200 },
        );
      }),
    );

    renderDetail();
    const user = userEvent.setup();

    const editBtns = await screen.findAllByRole("button", { name: /^sửa section nghiệp vụ$/i });
    await user.click(editBtns[0]!);

    const editForm = await screen.findByRole("form", { name: /đang chỉnh sửa business/i });
    const textarea = within(editForm).getByLabelText(/markdown source/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("# Original\n\nbody");

    await user.clear(textarea);
    await user.type(textarea, "# Updated");
    await user.click(within(editForm).getByRole("button", { name: /^lưu$/i }));

    await waitFor(() => expect(putCalled).toBe(true));
    // Editor collapses → form gone
    await waitFor(() => {
      expect(screen.queryByRole("form", { name: /đang chỉnh sửa business/i })).toBeNull();
    });
  });

  it("independent per-section state: opening B while A is open keeps both", async () => {
    mockSession("admin");
    mockFeature();
    renderDetail();
    const user = userEvent.setup();

    const businessBtn = await screen.findByRole("button", {
      name: /^sửa section nghiệp vụ$/i,
    });
    await user.click(businessBtn);
    const userFlowBtn = screen.getByRole("button", { name: /^sửa section user flow$/i });
    await user.click(userFlowBtn);

    expect(screen.getByRole("form", { name: /đang chỉnh sửa business/i })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /đang chỉnh sửa user-flow/i })).toBeInTheDocument();
  });

  it("business editor has no UploadButton (only tech-notes/screenshots do)", async () => {
    mockSession("admin");
    mockFeature();
    renderDetail();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /^sửa section nghiệp vụ$/i }));
    const businessForm = await screen.findByRole("form", { name: /đang chỉnh sửa business/i });
    expect(within(businessForm).queryByRole("button", { name: /upload ảnh/i })).toBeNull();
  });

  it("cancel with dirty draft shows confirm; false keeps editor open", async () => {
    mockSession("admin");
    mockFeature({ businessBody: "initial" });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderDetail();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^sửa section nghiệp vụ$/i }));
    const form = await screen.findByRole("form", { name: /đang chỉnh sửa business/i });
    const textarea = within(form).getByLabelText(/markdown source/i) as HTMLTextAreaElement;
    await user.type(textarea, " more");

    await user.click(within(form).getByRole("button", { name: /hủy/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByRole("form", { name: /đang chỉnh sửa business/i })).toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
