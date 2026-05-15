import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { FeatureActionsMenu } from "@/components/features/FeatureActionsMenu";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

const feature = { slug: "dang-nhap", title: "Đăng nhập" };

function renderMenu() {
  return renderWithRouter(<FeatureActionsMenu projectSlug="pilot" feature={feature} />);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("FeatureActionsMenu (US-008)", () => {
  it("renders trigger with aria-label 'Thao tác feature'", async () => {
    renderMenu();
    expect(await screen.findByRole("button", { name: /thao tác feature/i })).toBeInTheDocument();
  });

  it("click trigger opens menu with 'Lưu trữ feature' item", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác feature/i }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /lưu trữ feature/i })).toBeInTheDocument();
  });

  it("confirm cancel → no POST sent", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    let posted = false;
    server.use(
      http.post(`${BASE}/projects/pilot/features/dang-nhap/archive`, () => {
        posted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác feature/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ feature/i }));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Lưu trữ feature "Đăng nhập"? Feature sẽ ẩn khỏi catalog, sections + uploads giữ nguyên.',
    );
    // Allow any async flush, then ensure POST never fired.
    await new Promise((r) => setTimeout(r, 30));
    expect(posted).toBe(false);
  });

  it("confirm OK → POST + success toast", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "t" as never);
    server.use(
      http.post(
        `${BASE}/projects/pilot/features/dang-nhap/archive`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác feature/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ feature/i }));

    await waitFor(() => expect(successSpy).toHaveBeenCalledWith("Đã lưu trữ feature"));
  });

  it("403 → 'Bạn không có quyền' error toast", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "t" as never);
    server.use(
      http.post(`${BASE}/projects/pilot/features/dang-nhap/archive`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "forbidden" } }, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác feature/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ feature/i }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith("Bạn không có quyền"));
  });

  it("404 → 'Feature không tồn tại' error toast", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "t" as never);
    server.use(
      http.post(`${BASE}/projects/pilot/features/dang-nhap/archive`, () =>
        HttpResponse.json(
          { error: { code: "FEATURE_NOT_FOUND", message: "missing" } },
          { status: 404 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderMenu();
    await user.click(await screen.findByRole("button", { name: /thao tác feature/i }));
    await user.click(await screen.findByRole("menuitem", { name: /lưu trữ feature/i }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith("Feature không tồn tại"));
  });
});
