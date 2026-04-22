import type { ReactElement } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Test render wrapper that mounts TanStack Query provider.
 * (Router is already provided by App → RouterProvider; tests that need
 * a specific initialEntry can override via a custom render.)
 */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>, options);
}
