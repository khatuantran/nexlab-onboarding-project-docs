import { Bell } from "lucide-react";

/**
 * v4 (CR-006): icon-only button size-9 rounded-[10px] with red dot
 * indicator pip. Still placeholder behavior — disabled, tooltip
 * "Sắp ra mắt"; live system lands post-pilot.
 */
export function NotificationBell(): JSX.Element {
  return (
    <button
      type="button"
      disabled
      title="Thông báo (sắp ra mắt)"
      aria-label="Thông báo (sắp ra mắt)"
      className="relative inline-flex size-9 items-center justify-center rounded-[10px] text-foreground/70 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Bell className="size-[17px]" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute right-[9px] top-[9px] size-[7px] rounded-full border-2 border-background bg-rose-500"
      />
    </button>
  );
}
