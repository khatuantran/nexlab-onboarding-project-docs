import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { SectionEditor } from "@/components/features/SectionEditor";
import { renderWithProviders } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function renderEditor(
  opts: {
    type?: "business" | "tech-notes" | "screenshots";
    initialBody?: string;
    onDone?: () => void;
  } = {},
) {
  const onDone = opts.onDone ?? vi.fn();
  renderWithProviders(
    <>
      <Toaster />
      <SectionEditor
        projectSlug="demo"
        featureSlug="login"
        featureId="f-1"
        type={opts.type ?? "tech-notes"}
        initialBody={opts.initialBody ?? ""}
        onDone={onDone}
      />
    </>,
  );
  return { onDone };
}

const pngFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "shot.png", {
  type: "image/png",
});

describe("SectionEditor — upload toolbar gate", () => {
  it("renders UploadButton cho tech-notes", () => {
    renderEditor({ type: "tech-notes" });
    expect(screen.getByRole("button", { name: /upload ảnh/i })).toBeInTheDocument();
  });

  it("renders UploadButton cho screenshots", () => {
    renderEditor({ type: "screenshots" });
    expect(screen.getByRole("button", { name: /upload ảnh/i })).toBeInTheDocument();
  });

  it("does NOT render UploadButton cho business", () => {
    renderEditor({ type: "business" });
    expect(screen.queryByRole("button", { name: /upload ảnh/i })).toBeNull();
  });
});

describe("SectionEditor — cursor insert after upload", () => {
  it("inserts markdown at current cursor position after successful upload", async () => {
    server.use(
      http.post(`${BASE}/features/f-1/uploads`, () =>
        HttpResponse.json(
          {
            data: {
              id: "abc-123",
              url: "/api/v1/uploads/abc-123",
              sizeBytes: 4,
              mimeType: "image/png",
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        ),
      ),
    );

    renderEditor({ type: "tech-notes", initialBody: "before after" });
    const user = userEvent.setup();
    const form = screen.getByRole("form", { name: /đang chỉnh sửa tech-notes/i });
    const textarea = within(form).getByLabelText(/markdown source/i) as HTMLTextAreaElement;
    // Move cursor to position 6 (between "before" and " after")
    textarea.setSelectionRange(6, 6);
    textarea.dispatchEvent(new Event("select", { bubbles: true }));

    const input = form.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, pngFile);

    await waitFor(() =>
      expect(textarea.value).toBe("before![shot](/api/v1/uploads/abc-123) after"),
    );
  });
});
