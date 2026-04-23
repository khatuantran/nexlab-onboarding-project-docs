import { describe, it, expect } from "vitest";
import { formatRelativeVi } from "@/lib/relativeTime";

describe("formatRelativeVi", () => {
  it("returns Vietnamese distance for a past date", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const out = formatRelativeVi(twoHoursAgo);
    // date-fns vi may render "2 giờ trước" or "khoảng 2 giờ trước"
    expect(out).toMatch(/2 giờ trước/);
  });

  it("accepts ISO string input", () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const out = formatRelativeVi(thirtyMinAgo);
    expect(out).toMatch(/phút trước/);
  });
});
