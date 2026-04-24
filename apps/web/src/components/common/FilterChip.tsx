import { X } from "lucide-react";

export interface FilterChipProps {
  label: string;
  onRemove: () => void;
  ariaLabel?: string;
}

export function FilterChip({ label, onRemove, ariaLabel }: FilterChipProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={ariaLabel ?? `Bỏ lọc: ${label}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-secondary-bg px-3 py-1.5 font-ui text-xs font-medium text-secondary-text transition-colors hover:border-secondary hover:bg-secondary-bg/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{label}</span>
      <X className="size-3.5" aria-hidden="true" />
    </button>
  );
}
