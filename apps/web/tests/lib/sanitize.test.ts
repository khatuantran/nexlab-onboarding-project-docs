import { describe, it, expect } from "vitest";
import { sanitizeSnippet } from "@/lib/sanitize";

describe("sanitizeSnippet", () => {
  it("preserves <mark> tags with their text content", () => {
    const result = sanitizeSnippet("user <mark>login</mark> qua email");
    expect(result).toContain("<mark>login</mark>");
  });

  it("strips <script> tags (XSS)", () => {
    const result = sanitizeSnippet("<script>alert(1)</script><mark>hit</mark>");
    expect(result).not.toContain("<script");
    expect(result).toContain("<mark>hit</mark>");
  });

  it("strips event handlers on tags", () => {
    const result = sanitizeSnippet('<p onclick="evil()">text</p>');
    expect(result).not.toMatch(/\son\w+=/);
  });

  it("strips <img> / <a> / other non-mark tags entirely", () => {
    const result = sanitizeSnippet('<img src="x" /><a href="javascript:alert(1)">link</a>');
    expect(result).not.toContain("<img");
    expect(result).not.toContain("<a");
    expect(result).not.toContain("javascript:");
  });

  it("keeps plain text untouched", () => {
    expect(sanitizeSnippet("Đăng nhập bằng email")).toBe("Đăng nhập bằng email");
  });
});
