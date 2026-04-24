import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { UploadButton } from "@/components/features/UploadButton";
import { renderWithProviders } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function renderWithToast(onUploaded = vi.fn()) {
  renderWithProviders(
    <>
      <Toaster />
      <UploadButton featureId="f-1" onUploaded={onUploaded} />
    </>,
  );
  return { onUploaded };
}

const pngFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "shot.png", {
  type: "image/png",
});

describe("UploadButton", () => {
  it("renders 'Upload ảnh' label + hidden file input", () => {
    renderWithToast();
    const btn = screen.getByRole("button", { name: /upload ảnh/i });
    expect(btn).toBeInTheDocument();
  });

  it("POSTs multipart on file chosen and calls onUploaded with markdown", async () => {
    server.use(
      http.post(`${BASE}/features/f-1/uploads`, () =>
        HttpResponse.json(
          {
            data: {
              id: "11111111-1111-1111-1111-111111111111",
              url: "/api/v1/uploads/11111111-1111-1111-1111-111111111111",
              sizeBytes: 4,
              mimeType: "image/png",
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        ),
      ),
    );

    const { onUploaded } = renderWithToast();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const user = userEvent.setup();
    await user.upload(input, pngFile);

    await waitFor(() => expect(onUploaded).toHaveBeenCalled());
    const [markdown, upload] = onUploaded.mock.calls[0] as [string, { id: string }];
    expect(markdown).toBe("![shot](/api/v1/uploads/11111111-1111-1111-1111-111111111111)");
    expect(upload.id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("413 FILE_TOO_LARGE → destructive toast", async () => {
    server.use(
      http.post(`${BASE}/features/f-1/uploads`, () =>
        HttpResponse.json(
          { error: { code: "FILE_TOO_LARGE", message: "too big" } },
          { status: 413 },
        ),
      ),
    );
    const { onUploaded } = renderWithToast();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.setup().upload(input, pngFile);
    await screen.findByText(/file quá lớn/i);
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("415 UNSUPPORTED_MEDIA_TYPE → destructive toast", async () => {
    server.use(
      http.post(`${BASE}/features/f-1/uploads`, () =>
        HttpResponse.json(
          { error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "nope" } },
          { status: 415 },
        ),
      ),
    );
    renderWithToast();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.setup().upload(input, pngFile);
    await screen.findByText(/chỉ chấp nhận png, jpg, webp/i);
  });
});
