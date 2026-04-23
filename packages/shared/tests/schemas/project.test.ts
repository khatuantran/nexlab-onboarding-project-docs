import { describe, expect, it } from "vitest";
import { createProjectRequestSchema } from "../../src/schemas/project.js";

describe("createProjectRequestSchema", () => {
  it("accepts minimal valid payload", () => {
    const res = createProjectRequestSchema.safeParse({
      slug: "pilot-project",
      name: "Pilot Project",
    });
    expect(res.success).toBe(true);
  });

  it("accepts payload with description", () => {
    const res = createProjectRequestSchema.safeParse({
      slug: "pilot-project",
      name: "Pilot Project",
      description: "MVP v1 onboarding catalog.",
    });
    expect(res.success).toBe(true);
  });

  it("rejects uppercase slug", () => {
    const res = createProjectRequestSchema.safeParse({
      slug: "Pilot-Project",
      name: "x",
    });
    expect(res.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const res = createProjectRequestSchema.safeParse({
      slug: "pilot project",
      name: "x",
    });
    expect(res.success).toBe(false);
  });

  it("rejects empty name", () => {
    const res = createProjectRequestSchema.safeParse({
      slug: "pilot-project",
      name: "",
    });
    expect(res.success).toBe(false);
  });

  it("rejects name over 120 chars", () => {
    const res = createProjectRequestSchema.safeParse({
      slug: "pilot-project",
      name: "x".repeat(121),
    });
    expect(res.success).toBe(false);
  });

  it("rejects description over 1000 chars", () => {
    const res = createProjectRequestSchema.safeParse({
      slug: "pilot-project",
      name: "x",
      description: "a".repeat(1001),
    });
    expect(res.success).toBe(false);
  });
});
