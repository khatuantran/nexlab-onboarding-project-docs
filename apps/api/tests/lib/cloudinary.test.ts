import { describe, expect, it } from "vitest";
import { createCloudinaryClient } from "../../src/lib/cloudinary.js";

describe("createCloudinaryClient (CR-004 / Phase 2)", () => {
  it("isConfigured returns false when CLOUDINARY_URL is empty", () => {
    const client = createCloudinaryClient("");
    expect(client.isConfigured()).toBe(false);
  });

  it("isConfigured returns true when CLOUDINARY_URL is set", () => {
    const client = createCloudinaryClient("cloudinary://key:secret@cloud");
    expect(client.isConfigured()).toBe(true);
  });

  it("uploadImage rejects when not configured", async () => {
    const client = createCloudinaryClient("");
    await expect(
      client.uploadImage({
        buffer: Buffer.from("test"),
        publicId: "test/123",
      }),
    ).rejects.toThrow(/not configured/i);
  });
});
