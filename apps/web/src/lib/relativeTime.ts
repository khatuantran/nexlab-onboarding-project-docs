import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Vietnamese relative-time helper per .specs/ui/design-system.md §6.2.
 * Accepts Date | string (ISO) | number (epoch ms).
 */
export function formatRelativeVi(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
}
