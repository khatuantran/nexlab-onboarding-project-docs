import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route, useLocation } from "react-router-dom";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function mockMe(role: "admin" | "author") {
  server.use(
    http.get(`${BASE}/auth/me`, () =>
      HttpResponse.json(
        { data: { user: { id: "u-1", email: "a@b", displayName: "Admin", role } } },
        { status: 200 },
      ),
    ),
  );
}

/**
 * CR-006 v3 note: admin gate (who renders this dialog) lives at the caller
 * (HomePage section header) since AppHeader Row 2 was eliminated. These
 * tests focus on dialog form behavior, rendered directly without an admin
 * harness. Admin/author visibility is asserted in HomePage tests.
 */
describe("CreateProjectDialog — form behavior", () => {
  it("opens dialog and auto-derives slug from name (strip diacritics)", async () => {
    mockMe("admin");
    renderWithRouter(<CreateProjectDialog triggerLabel="Tạo project" />, ["/"]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /tạo project/i }));

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/tên project/i);
    await user.type(nameInput, "Dự án A");

    const slugInput = within(dialog).getByLabelText(/^slug/i) as HTMLInputElement;
    await waitFor(() => {
      expect(slugInput.value).toBe("du-an-a");
    });
  });

  it("submits then navigates to /projects/:slug on 201", async () => {
    mockMe("admin");
    server.use(
      http.post(`${BASE}/projects`, async ({ request }) => {
        const body = (await request.json()) as { slug: string; name: string };
        return HttpResponse.json(
          {
            data: {
              id: "p-1",
              slug: body.slug,
              name: body.name,
              description: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        );
      }),
    );

    renderWithRouter(
      <Routes>
        <Route path="/" element={<CreateProjectDialog triggerLabel="Tạo project" />} />
        <Route path="/projects/:slug" element={<LocationProbe />} />
      </Routes>,
      ["/"],
    );

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /tạo project/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/tên project/i), "Pilot");
    await user.click(within(dialog).getByRole("button", { name: /^tạo project$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("loc").textContent).toBe("/projects/pilot");
    });
  });

  it("shows inline error on 409 PROJECT_SLUG_TAKEN", async () => {
    mockMe("admin");
    server.use(
      http.post(`${BASE}/projects`, () =>
        HttpResponse.json(
          { error: { code: "PROJECT_SLUG_TAKEN", message: "Slug đã được dùng" } },
          { status: 409 },
        ),
      ),
    );

    renderWithRouter(<CreateProjectDialog triggerLabel="Tạo project" />, ["/"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /tạo project/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/tên project/i), "Pilot");
    await user.click(within(dialog).getByRole("button", { name: /^tạo project$/i }));

    expect(await within(dialog).findByText(/slug đã được dùng/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("confirm prompt on cancel when form is dirty", async () => {
    mockMe("admin");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithRouter(<CreateProjectDialog triggerLabel="Tạo project" />, ["/"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /tạo project/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/tên project/i), "draft");

    await user.click(within(dialog).getByRole("button", { name: /hủy/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
