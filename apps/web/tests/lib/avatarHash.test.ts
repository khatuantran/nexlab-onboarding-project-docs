import { describe, expect, it } from "vitest";
import { avatarBucket, avatarInitial } from "@/lib/avatarHash";

describe("avatarHash", () => {
  it("avatarBucket returns deterministic gradient for same seed", () => {
    expect(avatarBucket("pilot-project")).toBe(avatarBucket("pilot-project"));
  });

  it("avatarBucket returns different buckets across seeds (sample spread)", () => {
    const seeds = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    const buckets = new Set(seeds.map(avatarBucket));
    expect(buckets.size).toBeGreaterThan(1);
  });

  it("avatarInitial returns single uppercase char by default", () => {
    expect(avatarInitial("pilot project")).toBe("P");
    expect(avatarInitial("đăng nhập")).toBe("Đ");
  });

  it("avatarInitial returns 2-char from first word", () => {
    expect(avatarInitial("Pilot Project", 2)).toBe("PI");
    expect(avatarInitial("alpha", 2)).toBe("AL");
  });

  it("avatarInitial fallback ? for empty/whitespace", () => {
    expect(avatarInitial("")).toBe("?");
    expect(avatarInitial("   ")).toBe("?");
  });
});
