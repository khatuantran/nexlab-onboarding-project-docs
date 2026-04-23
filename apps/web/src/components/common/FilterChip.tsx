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
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{label}</span>
      <X className="size-3.5" aria-hidden="true" />
    </button>
  );
}
