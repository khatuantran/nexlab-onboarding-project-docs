import { describe, expect, it } from "vitest";
import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("lowercases + hyphenates plain ASCII", () => {
    expect(toSlug("Pilot Project")).toBe("pilot-project");
  });

  it("strips Vietnamese diacritics", () => {
    expect(toSlug("Dự án A")).toBe("du-an-a");
    expect(toSlug("Đăng nhập bằng email")).toBe("dang-nhap-bang-email");
  });

  it("collapses multiple spaces/symbols into single hyphen", () => {
    expect(toSlug("Foo   bar!!!baz")).toBe("foo-bar-baz");
  });

  it("trims leading + trailing hyphens", () => {
    expect(toSlug("  --Hello--  ")).toBe("hello");
  });

  it("handles empty input", () => {
    expect(toSlug("")).toBe("");
  });
});
