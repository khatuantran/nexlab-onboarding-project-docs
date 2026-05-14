import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown — embed swap (FR-EMBED-001)", () => {
  it("replaces whitelisted github.com autolink with embed-card", () => {
    const html = renderMarkdown("Xem PR: https://github.com/acme/repo/pull/42");
    expect(html).toContain('class="embed-card"');
    expect(html).toContain('href="https://github.com/acme/repo/pull/42"');
    expect(html).toContain("github.com");
    expect(html).toMatch(/<svg[^>]+viewBox/);
  });

  it("replaces figma.com autolink with embed-card", () => {
    const html = renderMarkdown("https://www.figma.com/file/abc?node-id=1");
    expect(html).toContain('class="embed-card"');
    expect(html).toContain("figma.com");
  });

  it("keeps non-whitelist example.com as plain anchor", () => {
    const html = renderMarkdown("[label](https://example.com/page)");
    expect(html).not.toContain("embed-card");
    expect(html).toMatch(/<a[^>]+href="https:\/\/example\.com\/page"/);
  });

  it("keeps link with custom label (not autolink) as plain anchor", () => {
    const html = renderMarkdown("[my PR](https://github.com/acme/repo/pull/42)");
    expect(html).not.toContain("embed-card");
  });

  it("embed card anchor has target _blank + rel noopener", () => {
    const html = renderMarkdown("https://github.com/a/b");
    expect(html).toMatch(/class="embed-card"[^>]*target="_blank"/);
    expect(html).toMatch(/rel="noopener noreferrer"/);
  });
});

/**
 * Unit test cho markdown pipeline (markdown-it + DOMPurify).
 * Policy chi tiết ở .specs/ui/design-system.md §6.1.
 */

describe("renderMarkdown", () => {
  it("renders basic markdown headings + bold + list", () => {
    const html = renderMarkdown("# Hello\n\n**bold** and *em*\n\n- one\n- two");
    expect(html).toContain("<h1>");
    expect(html).toContain("Hello");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>em</em>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
  });

  it("never emits an executable <script> tag from user input (XSS)", () => {
    // Raw HTML is disabled (html: false) → literal text only.
    // DOMPurify would strip it too for belt-and-suspenders.
    const html = renderMarkdown("before<script>alert(1)</script>after");
    expect(html).not.toMatch(/<script/i);
  });

  it('never emits an <a href="javascript:"> link', () => {
    const html = renderMarkdown("[evil](javascript:alert(1))");
    expect(html).not.toMatch(/<a[^>]*href=["']?javascript:/iu);
  });

  it("never emits an element with an on* event handler attribute", () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toMatch(/<\w+[^>]*\son\w+=/iu);
  });

  it("renders code block with <pre><code>", () => {
    const html = renderMarkdown("```\nconst x = 1;\n```");
    expect(html).toMatch(/<pre>[\s\S]*<code>/);
    expect(html).toContain("const x = 1;");
  });
});

describe("renderMarkdown — upload URL rewrite (BUG-003)", () => {
  // In prod the FE is on a different origin than the BE, so relative
  // `/api/v1/uploads/:id` paths must be rewritten to the absolute API
  // origin before reaching the browser's `<img>` resolver.
  it("rewrites relative /api/v1/uploads/:id img src to an absolute URL", () => {
    const html = renderMarkdown("![cap](/api/v1/uploads/abc-123)");
    const match = html.match(/<img[^>]+src="([^"]+)"/);
    expect(match).not.toBeNull();
    const src = match![1]!;
    expect(src).toMatch(/^https?:\/\//u);
    expect(src.endsWith("/api/v1/uploads/abc-123")).toBe(true);
  });

  it("rewrites legacy /uploads/:id alias the same way", () => {
    const html = renderMarkdown("![cap](/uploads/abc-123)");
    const match = html.match(/<img[^>]+src="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1]!).toMatch(/^https?:\/\//u);
  });

  it("leaves absolute http(s) external image URLs untouched", () => {
    const html = renderMarkdown("![ext](https://cdn.example.com/x.png)");
    expect(html).toContain('src="https://cdn.example.com/x.png"');
  });

  it("still drops unsafe img src (data:, javascript:) via sanitizer", () => {
    const html = renderMarkdown("![x](javascript:alert(1))");
    expect(html).not.toMatch(/javascript:/iu);
  });
});
