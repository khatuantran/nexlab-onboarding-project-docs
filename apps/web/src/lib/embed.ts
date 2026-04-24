/**
 * Whitelisted embed providers (FR-EMBED-001). Non-whitelisted URLs
 * render as plain anchors; these render as `EmbedCard` in place.
 *
 * Hostname match uses strict `URL()` parsing + `endsWith('.' + domain) || === domain`
 * so `evil.com/github.com` does NOT match github.com.
 */
export type EmbedIcon = "github" | "figma" | "jira";

export interface EmbedDescriptor {
  hostname: string;
  pathname: string;
  domain: string;
  icon: EmbedIcon;
}

interface ProviderRule {
  domain: string;
  icon: EmbedIcon;
}

const PROVIDERS: ProviderRule[] = [
  { domain: "github.com", icon: "github" },
  { domain: "figma.com", icon: "figma" },
  { domain: "atlassian.net", icon: "jira" },
];

export function embedFromUrl(href: string): EmbedDescriptor | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  for (const rule of PROVIDERS) {
    if (host === rule.domain || host.endsWith("." + rule.domain)) {
      return {
        hostname: host,
        pathname: url.pathname + url.search,
        domain: rule.domain,
        icon: rule.icon,
      };
    }
  }
  return null;
}
