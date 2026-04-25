import type { FeatureStatus, SectionType } from "@onboarding/shared";
import { SectionTypeChips } from "./SectionTypeChips";
import { StatusChips } from "./StatusChips";
import { TimeRangeDropdown, type TimeRangePreset } from "./TimeRangeDropdown";
import { AuthorPicker } from "./AuthorPicker";

export interface FilterBarValue {
  sectionTypes: SectionType[];
  authorId: string | undefined;
  authorDisplayName: string | undefined;
  timeRange: TimeRangePreset;
  status: FeatureStatus | undefined;
}

export interface FilterBarProps {
  value: FilterBarValue;
  onChange: (next: FilterBarValue) => void;
}

/**
 * US-005 / FR-SEARCH-003 — composite filter row above the search results.
 * Section type / Author / Time range / Status. Each control owns its own
 * UI; FilterBar just wires them to the same value bag so the page can
 * derive URL state in one place.
 */
export function FilterBar({ value, onChange }: FilterBarProps): JSX.Element {
  return (
    <section
      role="search"
      aria-label="Bộ lọc tìm kiếm"
      className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-muted/40 px-4 py-3"
    >
      <Cluster label="Loại">
        <SectionTypeChips
          value={value.sectionTypes}
          onChange={(next) => onChange({ ...value, sectionTypes: next })}
        />
      </Cluster>
      <Cluster label="Tác giả">
        <AuthorPicker
          value={value.authorId}
          selectedDisplayName={value.authorDisplayName}
          onChange={(next) =>
            onChange({
              ...value,
              authorId: next?.id,
              authorDisplayName: next?.displayName,
            })
          }
        />
      </Cluster>
      <Cluster label="Cập nhật">
        <TimeRangeDropdown
          value={value.timeRange}
          onChange={(preset) => onChange({ ...value, timeRange: preset })}
        />
      </Cluster>
      <Cluster label="Trạng thái">
        <StatusChips
          value={value.status}
          onChange={(next) => onChange({ ...value, status: next })}
        />
      </Cluster>
    </section>
  );
}

function Cluster({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="font-ui text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}:
      </span>
      {children}
    </div>
  );
}
