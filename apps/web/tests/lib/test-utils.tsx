import type { ReactElement } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Plain TanStack Query provider. Use when the component under test
 * already has its own Router (e.g. rendering `<App />`).
 */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  return render(<QueryClientProvider client={makeClient()}>{ui}</QueryClientProvider>, options);
}

/**
 * Query + MemoryRouter wrapper. Use for testing a page component in
 * isolation with a specific initial path (e.g. `/login?next=/x`).
 */
export function renderWithRouter(
  ui: ReactElement,
  initialEntries: string[] = ["/"],
  options: RenderOptions = {},
): RenderResult {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
    options,
  );
}
