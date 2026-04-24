import { describe, expect, it } from "vitest";
import { updateProjectRequestSchema } from "../../src/schemas/project.js";

describe("updateProjectRequestSchema", () => {
  it("accepts name + description", () => {
    const res = updateProjectRequestSchema.safeParse({
      name: "Pilot Project V2",
      description: "Updated pilot scope",
    });
    expect(res.success).toBe(true);
  });

  it("accepts name only (description optional)", () => {
    const res = updateProjectRequestSchema.safeParse({ name: "Renamed" });
    expect(res.success).toBe(true);
  });

  it("strips slug silently (immutable, not in schema)", () => {
    const res = updateProjectRequestSchema.safeParse({
      name: "ok",
      slug: "attempt-to-change-slug",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect("slug" in res.data).toBe(false);
    }
  });

  it("rejects empty name", () => {
    const res = updateProjectRequestSchema.safeParse({ name: "" });
    expect(res.success).toBe(false);
  });

  it("rejects name over 120 chars", () => {
    const res = updateProjectRequestSchema.safeParse({ name: "x".repeat(121) });
    expect(res.success).toBe(false);
  });

  it("rejects description over 1000 chars", () => {
    const res = updateProjectRequestSchema.safeParse({
      name: "x",
      description: "a".repeat(1001),
    });
    expect(res.success).toBe(false);
  });
});
