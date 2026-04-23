import DOMPurify from "dompurify";

/**
 * Sanitize search snippet HTML returned by the API. Backend embeds
 * `<mark>` tags around matched terms; everything else in the string is
 * user-provided content and must be treated as untrusted. Whitelist is
 * intentionally minimal: only `<mark>`, no attributes, no other tags.
 */
export function sanitizeSnippet(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["mark"],
    ALLOWED_ATTR: [],
  });
}
