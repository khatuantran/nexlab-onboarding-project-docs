import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/lib/theme";

const LABEL: Record<Theme, string> = {
  light: "Đang dùng chế độ sáng",
  dark: "Đang dùng chế độ tối",
  system: "Theo chế độ hệ thống",
};

const ICON_FOR: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle(): JSX.Element {
  const { theme, cycleTheme } = useTheme();
  const Icon = ICON_FOR[theme];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
      onClick={cycleTheme}
    >
      <Icon className="size-5" aria-hidden="true" />
    </Button>
  );
}
