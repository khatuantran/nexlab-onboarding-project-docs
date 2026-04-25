import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  Code,
  Image,
  ListChecks,
  Plus,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SECTION_ORDER, type SectionResponse, type SectionType } from "@onboarding/shared";
import { cn } from "@/lib/cn";

const LABEL: Record<SectionType, string> = {
  business: "Nghiệp vụ",
  "user-flow": "User flow",
  "business-rules": "Business rules",
  "tech-notes": "Tech notes",
  screenshots: "Screenshots",
};

const ICON: Record<SectionType, LucideIcon> = {
  business: Briefcase,
  "user-flow": Workflow,
  "business-rules": ListChecks,
  "tech-notes": Code,
  screenshots: Image,
};

interface SectionTocProps {
  sections: SectionResponse[];
}

/**
 * Sticky desktop TOC pill list per feature-detail.md (CR-002 Phase 1B-3).
 * Each item: section icon + label + status disc (filled = success check;
 * empty = dashed circle). Active highlighted với primary bg + left rail.
 */
export function SectionToc({ sections }: SectionTocProps): JSX.Element {
  const [active, setActive] = useState<SectionType>("business");
  const filledMap = useMemo(() => {
    const m = new Map<SectionType, boolean>();
    for (const s of sections) m.set(s.type, s.body.trim().length > 0);
    return m;
  }, [sections]);

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
    <aside className="sticky top-5 hidden self-start lg:block">
      <nav aria-label="Mục lục section" className="rounded-xl border border-border bg-card p-3.5">
        <p className="mb-2.5 font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Sections
        </p>
        <ol className="flex flex-col gap-0.5">
          {SECTION_ORDER.map((type) => {
            const isActive = active === type;
            const filled = filledMap.get(type) === true;
            const Icon = ICON[type];
            return (
              <li key={type}>
                <a
                  href={`#section-${type}`}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-ui text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-primary"
                      : "text-foreground/70 hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1 truncate">{LABEL[type]}</span>
                  {filled ? (
                    <span
                      aria-label="đã có nội dung"
                      className="inline-flex size-3.5 items-center justify-center rounded-full bg-success text-white"
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      aria-label="chưa có nội dung"
                      className="size-3.5 rounded-full border border-dashed border-muted-foreground/40"
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ol>
        <div className="mt-3.5 border-t border-border pt-3.5">
          <button
            type="button"
            onClick={() => toast("5 sections cố định trong v1; custom sections trong v2")}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/40 bg-transparent font-ui text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-3" aria-hidden="true" />
            Thêm section
          </button>
        </div>
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
