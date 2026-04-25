import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TimeRangePreset = "all" | "24h" | "7d" | "30d";

const PRESETS: { value: TimeRangePreset; label: string; days: number | null }[] = [
  { value: "all", label: "Mọi lúc", days: null },
  { value: "24h", label: "24 giờ qua", days: 1 },
  { value: "7d", label: "7 ngày qua", days: 7 },
  { value: "30d", label: "30 ngày qua", days: 30 },
];

const LABELS: Record<TimeRangePreset, string> = {
  all: "Mọi lúc",
  "24h": "24 giờ",
  "7d": "7 ngày",
  "30d": "30 ngày",
};

export interface TimeRangeDropdownProps {
  value: TimeRangePreset;
  onChange: (preset: TimeRangePreset, isoSince: string | undefined) => void;
}

export function presetToIso(preset: TimeRangePreset): string | undefined {
  const found = PRESETS.find((p) => p.value === preset);
  if (!found || found.days === null) return undefined;
  const ms = found.days * 24 * 3600 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

export function isoToPreset(iso: string | undefined): TimeRangePreset {
  if (!iso) return "all";
  const ageMs = Date.now() - new Date(iso).getTime();
  const days = ageMs / (24 * 3600 * 1000);
  if (days <= 1.5) return "24h";
  if (days <= 8) return "7d";
  if (days <= 31) return "30d";
  return "all";
}

export function TimeRangeDropdown({ value, onChange }: TimeRangeDropdownProps): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-haspopup="listbox"
        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2.5 font-ui text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LABELS[value]}
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" role="listbox">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            role="option"
            aria-selected={value === preset.value}
            onClick={() => onChange(preset.value, presetToIso(preset.value))}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-left font-ui text-xs hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            {preset.label}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
