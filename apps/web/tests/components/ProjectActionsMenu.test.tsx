import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

const project = {
  slug: "pilot",
  name: "Pilot Project",
  description: "MVP v1",
};

function renderMenu(initialPath = "/projects/pilot") {
  return renderWithRouter(
    <Routes>
      <Route path="/projects/:slug" element={<ProjectActionsMenu project={project} />} />
      <Route path="/" element={<div data-testid="home-marker">Home</div>} />
    </Routes>,
    [initialPath],
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ProjectActionsMenu", () => {
  it("renders trigger with aria-label 'Thao tác project'", async () => {
    renderMenu();
    expect(await screen.findByRole("button", { name: /thao tác project/i })).toBeInTheDocument();
  });

  it("click trigger opens menu with 2 items", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác project/i }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sửa project/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /lưu trữ project/i })).toBeInTheDocument();
  });

  it("click 'Sửa project' opens EditProjectDialog", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác project/i }));
    await user.click(await screen.findByRole("menuitem", { name: /sửa project/i }));
    expect(await screen.findByRole("dialog", { name: /sửa project/i })).toBeInTheDocument();
  });

  it("click 'Lưu trữ project' opens ConfirmDialog; clicking 'Huỷ' closes it without POST", async () => {
    let posted = false;
    server.use(
      http.post(`${BASE}/projects/pilot/archive`, () => {
        posted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác project/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ project/i }));

    const dialog = await screen.findByRole("dialog", { name: /lưu trữ project "pilot project"/i });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^huỷ$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /lưu trữ project/i })).toBeNull(),
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(posted).toBe(false);
  });

  it("confirm archive → POST /archive → toast + navigate /", async () => {
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "t" as never);
    server.use(
      http.post(`${BASE}/projects/pilot/archive`, () => new HttpResponse(null, { status: 204 })),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác project/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ project/i }));
    const dialog = await screen.findByRole("dialog", { name: /lưu trữ project "pilot project"/i });
    await user.click(within(dialog).getByRole("button", { name: /^lưu trữ$/i }));

    await waitFor(() => expect(successSpy).toHaveBeenCalledWith("Đã lưu trữ project"));
    expect(await screen.findByTestId("home-marker")).toBeInTheDocument();
  });

  it("archive 403 → destructive toast", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "t" as never);
    server.use(
      http.post(`${BASE}/projects/pilot/archive`, () =>
        HttpResponse.json(
          { error: { code: "FORBIDDEN", message: "Bạn không có quyền" } },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác project/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ project/i }));
    const dialog = await screen.findByRole("dialog", { name: /lưu trữ project "pilot project"/i });
    await user.click(within(dialog).getByRole("button", { name: /^lưu trữ$/i }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith("Bạn không có quyền"));
  });
});
