import { useEffect, useState } from "react";

/**
 * Returns a value that trails `value` by `delay` ms. On rapid input
 * only the last change after the quiet window commits — ideal for
 * realtime markdown preview (200ms in SectionEditor).
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
