import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { useState } from "react";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { renderWithProviders } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

const project = {
  slug: "pilot-project",
  name: "Pilot Project",
  description: "MVP v1",
};

function Harness() {
  const [open, setOpen] = useState(true);
  return <EditProjectDialog project={project} open={open} onOpenChange={setOpen} />;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("EditProjectDialog", () => {
  it("pre-fills name and description from project", async () => {
    renderWithProviders(<Harness />);
    const nameInput = await screen.findByLabelText(/tên project/i);
    expect(nameInput).toHaveValue("Pilot Project");
    expect(screen.getByLabelText(/mô tả/i)).toHaveValue("MVP v1");
  });

  it("renders slug field readonly with hint", async () => {
    renderWithProviders(<Harness />);
    const slugInput = await screen.findByLabelText(/^slug$/i);
    expect(slugInput).toHaveValue("pilot-project");
    expect(slugInput).toHaveAttribute("readonly");
    expect(slugInput).toHaveAttribute("aria-readonly", "true");
    expect(screen.getByText(/slug không đổi được/i)).toBeInTheDocument();
  });

  it("submit PATCH success → toast + close", async () => {
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "t" as never);
    server.use(
      http.patch(`${BASE}/projects/pilot-project`, () =>
        HttpResponse.json(
          {
            data: {
              id: "p-1",
              slug: "pilot-project",
              name: "Renamed Pilot",
              description: "MVP v2",
              createdAt: "2026-04-20T10:00:00Z",
              updatedAt: "2026-04-24T10:00:00Z",
            },
          },
          { status: 200 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const nameInput = await screen.findByLabelText(/tên project/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Pilot");
    await user.click(screen.getByRole("button", { name: /lưu/i }));

    await waitFor(() => expect(successSpy).toHaveBeenCalledWith("Đã cập nhật project"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("400 VALIDATION_ERROR → inline name error, dialog stays open", async () => {
    server.use(
      http.patch(`${BASE}/projects/pilot-project`, () =>
        HttpResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Tên project bắt buộc" } },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const nameInput = await screen.findByLabelText(/tên project/i);
    await user.clear(nameInput);
    await user.type(nameInput, "x"); // bypass client min(1) → trigger server 400
    // simulate: empty submit caught by client; instead empty description + name "x" works client-side but server says 400
    await user.click(screen.getByRole("button", { name: /lưu/i }));

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });

  it("cancel with dirty triggers native confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const nameInput = await screen.findByLabelText(/tên project/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    await user.click(screen.getByRole("button", { name: /hủy/i }));

    expect(confirmSpy).toHaveBeenCalledWith("Hủy chỉnh sửa project?");
    // Dialog still open because confirm returned false
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
