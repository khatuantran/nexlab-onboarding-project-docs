import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * Theme infra tests — §1.2 of .specs/ui/design-system.md.
 * Covers: default state, cycle order, localStorage persist, fallback,
 * `<html class="dark">` application.
 */

function ReadCurrent() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <span data-testid="read">
      {theme}|{resolvedTheme}
    </span>
  );
}

function mountWithProvider() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
      <ReadCurrent />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  // jsdom defaults matchMedia to return `matches: false` once stubbed.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
});

describe("ThemeProvider + ThemeToggle", () => {
  it("defaults to `system` when localStorage is empty", () => {
    mountWithProvider();
    expect(screen.getByTestId("read").textContent).toBe("system|light");
  });

  it("toggles light ↔ dark on each click (BUG-002 — system removed from cycle)", async () => {
    mountWithProvider();
    const user = userEvent.setup();
    const btn = screen.getByRole("button", { name: /chế độ/i });

    // OS prefers light → initial system|light → click → dark
    await user.click(btn);
    expect(screen.getByTestId("read").textContent).toBe("dark|dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // dark → light
    await user.click(btn);
    expect(screen.getByTestId("read").textContent).toBe("light|light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // light → dark again
    await user.click(btn);
    expect(screen.getByTestId("read").textContent).toBe("dark|dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists the chosen theme to localStorage", async () => {
    mountWithProvider();
    const user = userEvent.setup();
    const btn = screen.getByRole("button", { name: /chế độ/i });

    await user.click(btn); // system|light → dark
    expect(localStorage.getItem("theme")).toBe("dark");

    await user.click(btn); // dark → light
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("hydrates from localStorage on mount", () => {
    localStorage.setItem("theme", "dark");
    mountWithProvider();
    expect(screen.getByTestId("read").textContent).toBe("dark|dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("BUG-002: dark → click → light flips in a single hop when OS prefers dark", async () => {
    // OS prefers dark, persisted theme is also dark.
    (window.matchMedia as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (query: string) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    );
    localStorage.setItem("theme", "dark");
    mountWithProvider();
    expect(screen.getByTestId("read").textContent).toBe("dark|dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    const user = userEvent.setup();
    const btn = screen.getByRole("button", { name: /chế độ/i });
    await user.click(btn);

    // Single click must flip to light, not park on `system` (which would
    // resolve back to dark on a dark-OS host and require a second click).
    expect(screen.getByTestId("read").textContent).toBe("light|light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("resolves `system` to dark when the OS prefers dark", () => {
    (window.matchMedia as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (query: string) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    );
    mountWithProvider();
    expect(screen.getByTestId("read").textContent).toBe("system|dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
