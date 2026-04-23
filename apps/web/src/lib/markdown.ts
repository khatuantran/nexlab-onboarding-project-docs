import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

/**
 * Markdown pipeline per .specs/ui/design-system.md §6.1:
 * - markdown-it with `html: false` (no raw HTML passthrough).
 * - DOMPurify with explicit whitelist — strips <script>, on* handlers,
 *   javascript: URLs, data: URLs (except images later if needed).
 */

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: true,
});

const ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "code",
  "pre",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "br",
  "mark",
  "span",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

const SAFE_URL_PREFIX = /^(https?:|mailto:|\/|#)/u;

export function renderMarkdown(source: string): string {
  const rawHtml = md.render(source);

  // External links: target="_blank" + rel="noopener noreferrer"
  // (post-sanitize walks DOM — but we do it via hook for DOMPurify).
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      if (!SAFE_URL_PREFIX.test(href)) {
        node.removeAttribute("href");
        return;
      }
      if (/^https?:/u.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") ?? "";
      if (!/^(https?:|\/uploads\/)/u.test(src)) {
        node.removeAttribute("src");
      }
    }
  });

  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  DOMPurify.removeAllHooks();
  return clean;
}
