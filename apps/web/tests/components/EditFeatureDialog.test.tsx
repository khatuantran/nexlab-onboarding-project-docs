import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FeatureListItem } from "@onboarding/shared";
import { Toaster } from "sonner";
import { Routes, Route } from "react-router-dom";
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
    <>
      <Toaster />
      <Routes>
        <Route
          path="/projects/:slug"
          element={<FeatureCard projectSlug="pilot" feature={feature} />}
        />
      </Routes>
    </>,
    ["/projects/pilot"],
  );
}

describe("EditFeatureDialog (US-012 / T3)", () => {
  it("admin menu exposes both 'Sửa feature' and 'Lưu trữ feature' items", async () => {
    mockMe("admin");
    const user = userEvent.setup();
    renderCard();

    const trigger = await screen.findByRole("button", { name: /thao tác feature/i });
    await user.click(trigger);

    expect(await screen.findByRole("menuitem", { name: /sửa feature/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /lưu trữ feature/i })).toBeInTheDocument();
  });

  it("submitting new title → PATCH sent + toast + dialog closes", async () => {
    mockMe("admin");
    let patchBody: unknown = null;
    server.use(
      http.patch(`${BASE}/projects/pilot/features/dang-nhap`, async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: "f-1",
              slug: "dang-nhap",
              title: "Sign in",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              contributors: [],
            },
          },
          { status: 200 },
        );
      }),
    );

    const user = userEvent.setup();
    renderCard();

    await user.click(await screen.findByRole("button", { name: /thao tác feature/i }));
    await user.click(await screen.findByRole("menuitem", { name: /sửa feature/i }));

    const dialog = await screen.findByRole("dialog", { name: /sửa feature/i });
    const titleInput = await screen.findByLabelText(/tiêu đề/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Sign in");
    await user.click(screen.getByRole("button", { name: /^lưu$/i }));

    expect(await screen.findByText(/đã cập nhật feature/i)).toBeInTheDocument();
    expect(patchBody).toEqual({ title: "Sign in" });
    expect(dialog).not.toBeInTheDocument();
  });

  it("server 409 conflict → inline slug error rendered, dialog stays open", async () => {
    mockMe("admin");
    server.use(
      http.patch(`${BASE}/projects/pilot/features/dang-nhap`, () =>
        HttpResponse.json(
          { error: { code: "FEATURE_SLUG_TAKEN", message: "Slug taken" } },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderCard();

    await user.click(await screen.findByRole("button", { name: /thao tác feature/i }));
    await user.click(await screen.findByRole("menuitem", { name: /sửa feature/i }));

    const slugInput = await screen.findByLabelText(/^slug \*/i);
    await user.clear(slugInput);
    await user.type(slugInput, "sign-in");
    await user.click(screen.getByRole("button", { name: /^lưu$/i }));

    expect(await screen.findByText(/slug đã có trong project này/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /sửa feature/i })).toBeInTheDocument();
  });
});
