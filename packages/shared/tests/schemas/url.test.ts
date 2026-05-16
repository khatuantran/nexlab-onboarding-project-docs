import { describe, expect, it } from "vitest";
import { urlSchema } from "../../src/schemas/feature.js";

describe("urlSchema (US-013)", () => {
  it("accepts https URL", () => {
    expect(urlSchema.safeParse("https://github.com/foo/bar").success).toBe(true);
  });

  it("accepts http URL", () => {
    expect(urlSchema.safeParse("http://localhost:3000/x").success).toBe(true);
  });

  it("rejects ftp scheme", () => {
    expect(urlSchema.safeParse("ftp://example.com/file").success).toBe(false);
  });

  it("rejects bare string without scheme", () => {
    expect(urlSchema.safeParse("not-a-url").success).toBe(false);
  });

  it("rejects URL over 500 chars", () => {
    const longUrl = "https://example.com/" + "x".repeat(500);
    expect(urlSchema.safeParse(longUrl).success).toBe(false);
  });
});
