import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type ResolvedTheme } from "@/lib/theme";

// Icon + label reflect the visible (resolved) mode so the click target
// always matches what the user sees, not the underlying tri-state. See
// BUG-002 for context.
const LABEL: Record<ResolvedTheme, string> = {
  light: "Đang dùng chế độ sáng",
  dark: "Đang dùng chế độ tối",
};

const ICON_FOR: Record<ResolvedTheme, typeof Sun> = {
  light: Sun,
  dark: Moon,
};

export function ThemeToggle(): JSX.Element {
  const { resolvedTheme, cycleTheme } = useTheme();
  const Icon = ICON_FOR[resolvedTheme];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={LABEL[resolvedTheme]}
      title={LABEL[resolvedTheme]}
      onClick={cycleTheme}
    >
      <Icon className="size-5" aria-hidden="true" />
    </Button>
  );
}
