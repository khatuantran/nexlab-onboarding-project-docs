import { describe, expect, it } from "vitest";
import { createFeatureRequestSchema } from "../../src/schemas/feature.js";

describe("createFeatureRequestSchema", () => {
  it("accepts minimal valid payload", () => {
    const res = createFeatureRequestSchema.safeParse({
      slug: "dang-nhap-bang-email",
      title: "Đăng nhập bằng email",
    });
    expect(res.success).toBe(true);
  });

  it("rejects empty title", () => {
    const res = createFeatureRequestSchema.safeParse({
      slug: "ok-slug",
      title: "",
    });
    expect(res.success).toBe(false);
  });

  it("rejects title over 160 chars", () => {
    const res = createFeatureRequestSchema.safeParse({
      slug: "ok-slug",
      title: "x".repeat(161),
    });
    expect(res.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const res = createFeatureRequestSchema.safeParse({
      slug: "Invalid Slug!",
      title: "Login",
    });
    expect(res.success).toBe(false);
  });
});
