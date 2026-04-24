import { describe, expect, it } from "vitest";
import { embedFromUrl } from "@/lib/embed";

describe("embedFromUrl", () => {
  it("matches github.com", () => {
    expect(embedFromUrl("https://github.com/acme/repo/pull/42")).toMatchObject({
      icon: "github",
      domain: "github.com",
    });
  });

  it("matches subdomain foo.atlassian.net", () => {
    expect(embedFromUrl("https://foo.atlassian.net/browse/X-1")).toMatchObject({
      icon: "jira",
      domain: "atlassian.net",
    });
  });

  it("matches figma.com with query", () => {
    expect(embedFromUrl("https://www.figma.com/file/abc?node-id=1")).toMatchObject({
      icon: "figma",
      domain: "figma.com",
    });
  });

  it("rejects evil.com/github.com spoof (path segment, not hostname)", () => {
    expect(embedFromUrl("https://evil.com/github.com")).toBeNull();
  });

  it("rejects invalid URL", () => {
    expect(embedFromUrl("not a url")).toBeNull();
  });

  it("rejects non-whitelist example.com", () => {
    expect(embedFromUrl("https://example.com/page")).toBeNull();
  });

  it("rejects ftp protocol", () => {
    expect(embedFromUrl("ftp://github.com/x")).toBeNull();
  });
});
