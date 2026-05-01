import { describe, expect, it } from "vitest";
import { buildTsQuery } from "../../../src/repos/search/buildTsQuery.js";

describe("buildTsQuery (US-006 / FR-SEARCH-004)", () => {
  it("appends prefix marker to a single token", () => {
    expect(buildTsQuery("a")).toBe("a:*");
    expect(buildTsQuery("onboard")).toBe("onboard:*");
  });

  it("AND-joins multiple tokens with prefix markers", () => {
    expect(buildTsQuery("dang nhap")).toBe("dang:* & nhap:*");
  });

  it("preserves Unicode letters including Vietnamese diacritics", () => {
    expect(buildTsQuery("đăng nhập")).toBe("đăng:* & nhập:*");
  });

  it("strips tsquery operators and punctuation", () => {
    expect(buildTsQuery("foo&|!bar")).toBe("foo:* & bar:*");
    expect(buildTsQuery("hello, world!")).toBe("hello:* & world:*");
    expect(buildTsQuery("user@host.tld")).toBe("user:* & host:* & tld:*");
  });

  it("returns null when input has no usable token", () => {
    expect(buildTsQuery("")).toBeNull();
    expect(buildTsQuery("!!!")).toBeNull();
    expect(buildTsQuery("   ")).toBeNull();
    expect(buildTsQuery(":*&|()")).toBeNull();
  });

  it("collapses runs of whitespace and trims edges", () => {
    expect(buildTsQuery("  foo   bar  ")).toBe("foo:* & bar:*");
  });

  it("keeps alphanumeric mix as a single token", () => {
    expect(buildTsQuery("a3solutions")).toBe("a3solutions:*");
  });
});
