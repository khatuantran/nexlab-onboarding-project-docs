import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
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

describe("CreateProjectDialog — admin gate in AppHeader", () => {
  it("admin sees the 'Tạo project' trigger", async () => {
    mockMe("admin");
    renderWithRouter(<AppHeader />, ["/"]);
    const trigger = await screen.findByRole("button", { name: /tạo project/i });
    expect(trigger).toBeInTheDocument();
  });

  it("author does not see the trigger", async () => {
    mockMe("author");
    renderWithRouter(<AppHeader />, ["/"]);
    // Wait for /me resolution so render has stabilized
    await screen.findByTestId("current-user");
    expect(screen.queryByRole("button", { name: /tạo project/i })).toBeNull();
  });
});

describe("CreateProjectDialog — form behavior", () => {
  it("opens dialog and auto-derives slug from name (strip diacritics)", async () => {
    mockMe("admin");
    renderWithRouter(<AppHeader />, ["/"]);
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
        <Route path="/" element={<AppHeader />} />
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

    renderWithRouter(<AppHeader />, ["/"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /tạo project/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/tên project/i), "Pilot");
    await user.click(within(dialog).getByRole("button", { name: /^tạo project$/i }));

    expect(await within(dialog).findByText(/slug đã được dùng/i)).toBeInTheDocument();
    // Dialog stays open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("confirm prompt on cancel when form is dirty", async () => {
    mockMe("admin");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithRouter(<AppHeader />, ["/"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /tạo project/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/tên project/i), "draft");

    await user.click(within(dialog).getByRole("button", { name: /hủy/i }));

    expect(confirmSpy).toHaveBeenCalled();
    // confirm returned false → dialog stays
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
