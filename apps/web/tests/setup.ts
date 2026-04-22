import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Library cleanup runs automatically with globals:true +
// the auto-cleanup import, but we enforce it explicitly for clarity.
afterEach(() => {
  cleanup();
});
