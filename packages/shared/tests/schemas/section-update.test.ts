import { describe, expect, it } from "vitest";
import { updateSectionRequestSchema } from "../../src/schemas/section.js";

describe("updateSectionRequestSchema", () => {
  it("accepts empty body (clear section)", () => {
    const res = updateSectionRequestSchema.safeParse({ body: "" });
    expect(res.success).toBe(true);
  });

  it("accepts markdown body", () => {
    const res = updateSectionRequestSchema.safeParse({
      body: "# Heading\n\nparagraph.",
    });
    expect(res.success).toBe(true);
  });

  it("rejects missing body", () => {
    const res = updateSectionRequestSchema.safeParse({});
    expect(res.success).toBe(false);
  });

  it("rejects body over 65536 chars (char-level safety net)", () => {
    const res = updateSectionRequestSchema.safeParse({
      body: "a".repeat(65537),
    });
    expect(res.success).toBe(false);
  });
});
