import { describe, expect, it } from "vitest";
import { uploadResponseSchema } from "../../src/schemas/upload.js";

describe("uploadResponseSchema", () => {
  it("parses a valid server response", () => {
    const res = uploadResponseSchema.safeParse({
      id: "11111111-1111-1111-1111-111111111111",
      url: "/api/v1/uploads/11111111-1111-1111-1111-111111111111",
      sizeBytes: 1024,
      mimeType: "image/png",
      createdAt: new Date().toISOString(),
    });
    expect(res.success).toBe(true);
  });

  it("rejects non-whitelisted mime type", () => {
    const res = uploadResponseSchema.safeParse({
      id: "11111111-1111-1111-1111-111111111111",
      url: "/api/v1/uploads/abc",
      sizeBytes: 1,
      mimeType: "application/pdf",
      createdAt: new Date().toISOString(),
    });
    expect(res.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const res = uploadResponseSchema.safeParse({ id: "x" });
    expect(res.success).toBe(false);
  });
});
