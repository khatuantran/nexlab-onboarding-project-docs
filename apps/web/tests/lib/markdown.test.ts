import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

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
