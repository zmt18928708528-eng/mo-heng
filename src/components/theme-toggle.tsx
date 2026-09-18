import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const dark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={dark ? "切换为光亮皮肤" : "切换为黑暗皮肤"}
      title={dark ? "光亮" : "黑暗"}
    >
      {dark ? <Sun /> : <Moon />}
      {dark ? "光亮" : "黑暗"}
    </Button>
  );
}
