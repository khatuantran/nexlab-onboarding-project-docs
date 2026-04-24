import { useEffect, useState } from "react";
import { SECTION_ORDER, type SectionType } from "@onboarding/shared";
import { cn } from "@/lib/cn";

const LABEL: Record<SectionType, string> = {
  business: "Nghiệp vụ",
  "user-flow": "User flow",
  "business-rules": "Business rules",
  "tech-notes": "Tech notes",
  screenshots: "Screenshots",
};

/**
 * Left sidebar TOC for FeatureDetailPage desktop (≥ lg).
 * Mobile uses a <details> dropdown rendered by the page itself.
 *
 * Active state: IntersectionObserver on each section header.
 * Clicking a link scrolls via native anchor + `scroll-mt-24`.
 */
export function SectionToc(): JSX.Element {
  const [active, setActive] = useState<SectionType>("business");

  useEffect(() => {
    const elements = SECTION_ORDER.map((type) => document.getElementById(`section-${type}`)).filter(
      (el): el is HTMLElement => el !== null,
    );

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const id = visible.target.id.replace("section-", "") as SectionType;
          setActive(id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="sticky top-24 hidden self-start lg:block">
      <nav aria-label="Mục lục section" className="border-l border-border pl-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sections
        </p>
        <ol className="flex flex-col gap-1 text-sm">
          {SECTION_ORDER.map((type) => (
            <li key={type}>
              <a
                href={`#section-${type}`}
                className={cn(
                  "block rounded-md px-3 py-1.5 font-ui transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === type
                    ? "font-bold text-primary border-l-2 border-primary -ml-[2px] pl-[10px]"
                    : "text-muted-foreground",
                )}
              >
                {LABEL[type]}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}

export function SectionTocMobile(): JSX.Element {
  return (
    <details className="mb-6 rounded-md border border-border bg-muted/30 lg:hidden">
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-foreground">
        Sections
      </summary>
      <ol className="flex flex-col gap-1 border-t border-border px-4 py-2 text-sm">
        {SECTION_ORDER.map((type) => (
          <li key={type}>
            <a
              href={`#section-${type}`}
              className="block rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {LABEL[type]}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
