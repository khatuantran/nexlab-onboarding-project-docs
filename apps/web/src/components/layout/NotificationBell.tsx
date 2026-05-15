import { Bell } from "lucide-react";

/**
 * Placeholder notification bell — disabled, tooltip "Sắp ra mắt".
 * Live behavior lands when notification system ships (post-pilot).
 */
export function NotificationBell(): JSX.Element {
  return (
    <button
      type="button"
      disabled
      title="Thông báo (sắp ra mắt)"
      aria-label="Thông báo (sắp ra mắt)"
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Bell className="size-4" aria-hidden="true" />
    </button>
  );
}
