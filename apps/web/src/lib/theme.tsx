import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Theme state per .specs/ui/design-system.md §1.2:
 * - `light` / `dark` are explicit choices.
 * - `system` defers to `matchMedia("(prefers-color-scheme: dark)")`.
 * Persisted to `localStorage["theme"]`; hydrated on mount; applies
 * `.dark` on `<html>` whenever the resolved mode is dark.
 *
 * localStorage can be unavailable (incognito with strict privacy
 * settings, Safari Lockdown, etc.) — catch + fall back to memory only.
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const VALID: readonly Theme[] = ["light", "dark", "system"];

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && (VALID as readonly string[]).includes(v)) return v as Theme;
  } catch {
    // ignore — localStorage blocked
  }
  return "system";
}

function writeStored(t: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // ignore
  }
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

function applyHtmlClass(resolved: ResolvedTheme): void {
  const el = document.documentElement;
  if (resolved === "dark") el.classList.add("dark");
  else el.classList.remove("dark");
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(() => readStored());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(readStored()));

  const applyTheme = useCallback((next: Theme) => {
    const r = resolve(next);
    setResolvedTheme(r);
    applyHtmlClass(r);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for OS preference changes while theme = "system".
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (): void => applyTheme("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    writeStored(t);
  }, []);

  const cycleTheme = useCallback(() => {
    // BUG-002: a 3-state cycle that includes `system` causes the toggle to
    // appear unresponsive when the OS preference matches the current
    // resolved mode (dark→system→still dark on a dark-OS host). Toggle is
    // now driven by the visible (resolved) mode so every click flips it.
    setThemeState((prev) => {
      const currentResolved = resolve(prev);
      const next: Theme = currentResolved === "dark" ? "light" : "dark";
      writeStored(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
    [theme, resolvedTheme, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
