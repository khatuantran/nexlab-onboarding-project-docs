import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./lib/msw";

// jsdom has no IntersectionObserver — stub with a noop so components
// that rely on it (SectionToc) don't crash. Tests don't assert scroll
// behavior, so an inert mock is enough.
class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  thresholds = [];
}
Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  // Reset ThemeProvider side effects so tests don't leak theme state.
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterAll(() => server.close());
