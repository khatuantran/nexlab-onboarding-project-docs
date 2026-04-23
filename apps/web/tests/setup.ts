import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./lib/msw";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  // Reset ThemeProvider side effects so tests don't leak theme state.
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterAll(() => server.close());
