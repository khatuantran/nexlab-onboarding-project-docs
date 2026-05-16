import { describe, expect, it } from "vitest";
import { updateFeatureRequestSchema } from "../../src/schemas/feature.js";

describe("updateFeatureRequestSchema (US-012)", () => {
  it("accepts title only", () => {
    const res = updateFeatureRequestSchema.safeParse({ title: "Đổi tên" });
    expect(res.success).toBe(true);
  });

  it("accepts slug only", () => {
    const res = updateFeatureRequestSchema.safeParse({ slug: "doi-ten" });
    expect(res.success).toBe(true);
  });

  it("accepts both fields", () => {
    const res = updateFeatureRequestSchema.safeParse({
      title: "Sign in",
      slug: "sign-in",
    });
    expect(res.success).toBe(true);
  });

  it("rejects empty body with refine message", () => {
    const res = updateFeatureRequestSchema.safeParse({});
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.message === "Cần ít nhất 1 trường")).toBe(true);
    }
  });

  it("rejects invalid slug", () => {
    const res = updateFeatureRequestSchema.safeParse({ slug: "Bad Slug!" });
    expect(res.success).toBe(false);
  });

  it("rejects over-length title", () => {
    const res = updateFeatureRequestSchema.safeParse({ title: "x".repeat(161) });
    expect(res.success).toBe(false);
  });
});
