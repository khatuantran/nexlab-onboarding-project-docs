import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { embedFromUrl, type EmbedDescriptor } from "./embed";

/**
 * Origin of the BE API (https://onboarding-api-cool-waterfall-8568.fly.dev in prod, http://localhost:3001
 * in dev). Reused from VITE_API_BASE_URL so the FE has a single source of
 * truth — see apps/web/src/lib/api.ts.
 *
 * In prod the FE and BE are on different origins (Netlify FE + Fly BE per
 * CR-003), so an `<img src="/api/v1/uploads/:id">` written into a markdown
 * body would resolve against the Netlify origin and hit the SPA fallback
 * instead of the upload binary. We rewrite relative upload paths to the
 * absolute API origin at sanitize time. See BUG-003.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api/v1";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
})();

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
  "div",
  "svg",
  "path",
];

const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "target",
  "rel",
  "viewBox",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "d",
  "xmlns",
  "width",
  "height",
  "aria-hidden",
];

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
      if (/^\/api\/v1\/uploads\//u.test(src)) {
        // Relative upload path → prefix with API origin (BUG-003).
        node.setAttribute("src", API_ORIGIN + src);
      } else if (/^\/uploads\//u.test(src)) {
        // Legacy alias: rewrite to canonical /api/v1/uploads/:id under API origin.
        node.setAttribute("src", API_ORIGIN + "/api/v1" + src);
      } else if (!/^https?:/u.test(src)) {
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
  return applyEmbeds(clean);
}

const BRAND_ICONS: Record<EmbedDescriptor["icon"], string> = {
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20"><path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.12.82-.26.82-.58v-2.04c-3.34.72-4.04-1.6-4.04-1.6-.55-1.38-1.34-1.75-1.34-1.75-1.1-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.5.99.1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.47 5.93.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z"/></svg>',
  figma:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20"><path d="M8 24a4 4 0 0 0 4-4v-4H8a4 4 0 0 0 0 8Zm-4-12a4 4 0 0 0 4 4h4V8H8a4 4 0 0 0-4 4Zm0-8a4 4 0 0 0 4 4h4V0H8a4 4 0 0 0-4 4Zm12-4v8h4a4 4 0 1 0 0-8h-4Zm4 12a4 4 0 1 0-4 4 4 4 0 0 0 4-4Z"/></svg>',
  jira: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20"><path d="M11.53 2 2 11.53a.64.64 0 0 0 0 .94L11.53 22a.64.64 0 0 0 .94 0L22 12.47a.64.64 0 0 0 0-.94L12.47 2a.64.64 0 0 0-.94 0Zm.47 14.5L7.5 12l4.5-4.5L16.5 12Z"/></svg>',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmbedCardHtml(desc: EmbedDescriptor, href: string): string {
  const icon = BRAND_ICONS[desc.icon];
  const displayPath = desc.pathname.length > 48 ? desc.pathname.slice(0, 48) + "…" : desc.pathname;
  return [
    `<a class="embed-card" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`,
    `<span class="embed-card__icon">${icon}</span>`,
    `<span class="embed-card__body">`,
    `<span class="embed-card__path">${escapeHtml(displayPath || "/")}</span>`,
    `<span class="embed-card__domain">${escapeHtml(desc.domain)}</span>`,
    `</span>`,
    `</a>`,
  ].join("");
}

function applyEmbeds(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const wrapper = doc.body.firstElementChild;
  if (!wrapper) return html;
  const anchors = Array.from(wrapper.querySelectorAll("a"));
  for (const a of anchors) {
    const href = a.getAttribute("href") ?? "";
    const desc = embedFromUrl(href);
    if (!desc) continue;
    // Only convert when link text is the URL itself (autolink) or equals href —
    // a user who wrote `[my label](https://github.com/x)` keeps a plain anchor.
    const text = (a.textContent ?? "").trim();
    if (text !== href && text !== desc.hostname + desc.pathname) continue;
    a.outerHTML = renderEmbedCardHtml(desc, href);
  }
  return wrapper.innerHTML;
}
