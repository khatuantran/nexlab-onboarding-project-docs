import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — MVP smoke only (Chromium). Assumes API + DB +
 * Redis are already running (`pnpm docker:up && pnpm db:migrate && pnpm db:seed`).
 * `webServer` boots the Vite dev server on demand.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm --filter @onboarding/web dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
