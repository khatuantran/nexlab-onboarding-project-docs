import type { SectionType } from "@onboarding/shared";
import { cn } from "@/lib/cn";

const SECTION_LABELS: Record<SectionType, string> = {
  business: "Business",
  "user-flow": "User flow",
  "business-rules": "Rules",
  "tech-notes": "Tech",
  screenshots: "Screenshots",
};

const ORDER: SectionType[] = [
  "business",
  "user-flow",
  "business-rules",
  "tech-notes",
  "screenshots",
];

export interface SectionTypeChipsProps {
  value: SectionType[];
  onChange: (next: SectionType[]) => void;
}

/**
 * Multi-select chip group for the search filter bar (US-005 / FR-SEARCH-003).
 * Each chip toggles a section type in/out of the active filter array.
 */
export function SectionTypeChips({ value, onChange }: SectionTypeChipsProps): JSX.Element {
  const toggle = (type: SectionType) => {
    if (value.includes(type)) {
      onChange(value.filter((t) => t !== type));
    } else {
      onChange([...value, type]);
    }
  };

  return (
    <div role="group" aria-label="Lọc theo loại section" className="flex flex-wrap gap-1.5">
      {ORDER.map((type) => {
        const active = value.includes(type);
        return (
          <button
            key={type}
            type="button"
            role="checkbox"
            aria-checked={active}
            onClick={() => toggle(type)}
            className={cn(
              "inline-flex h-7 items-center rounded-md px-3 font-ui text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {SECTION_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
