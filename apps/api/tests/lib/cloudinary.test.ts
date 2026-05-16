import { describe, expect, it } from "vitest";
import { createCloudinaryClient, publicIdFromUrl } from "../../src/lib/cloudinary.js";

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

  it("destroyImage is no-op when not configured", async () => {
    const client = createCloudinaryClient("");
    await expect(client.destroyImage("any/id")).resolves.toBeUndefined();
  });
});

describe("publicIdFromUrl (US-009/US-019 delete amend)", () => {
  it("parses simple upload URL", () => {
    expect(
      publicIdFromUrl(
        "https://res.cloudinary.com/demo/image/upload/v1234/onboarding-portal/dev/covers/users/abc-123.png",
      ),
    ).toBe("onboarding-portal/dev/covers/users/abc-123");
  });

  it("parses URL with transformation chunk before version", () => {
    expect(
      publicIdFromUrl(
        "https://res.cloudinary.com/demo/image/upload/c_fill,w_2000,ar_21:9/v9/folder/uuid.webp",
      ),
    ).toBe("folder/uuid");
  });

  it("returns null for garbage URL", () => {
    expect(publicIdFromUrl("https://example.com/not-cloudinary")).toBeNull();
  });
});
