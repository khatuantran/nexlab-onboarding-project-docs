import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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

  it("click 'Lưu trữ project' shows native confirm with project name + consequence", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác project/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ project/i }));
    expect(confirmSpy).toHaveBeenCalledWith(
      'Lưu trữ project "Pilot Project"? Project sẽ ẩn khỏi catalog, features + sections giữ nguyên.',
    );
  });

  it("confirm archive → POST /archive → toast + navigate /", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "t" as never);
    server.use(
      http.post(`${BASE}/projects/pilot/archive`, () => new HttpResponse(null, { status: 204 })),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác project/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ project/i }));

    await waitFor(() => expect(successSpy).toHaveBeenCalledWith("Đã lưu trữ project"));
    expect(await screen.findByTestId("home-marker")).toBeInTheDocument();
  });

  it("archive 403 → destructive toast", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
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

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith("Bạn không có quyền"));
  });
});
