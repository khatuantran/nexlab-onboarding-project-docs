import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — MVP smoke only (Chromium).
 *
 * Test isolation: API is spawned with APP_ENV=test so it connects to
 * the dedicated `onboardingdb_test` database (Vite UI is unaffected;
 * it just talks to whichever API answers on :3001). Run
 * `pnpm docker:up && pnpm db:create:test && pnpm db:reset:test` once
 * before the first E2E run; subsequent runs reuse the migrated +
 * seeded test DB.
 *
 * `reuseExistingServer: true` so an already-running `pnpm dev:test`
 * is preferred over spawning new processes — useful when manually
 * iterating against the test DB during E2E debugging.
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
  webServer: [
    {
      command: "pnpm --filter @onboarding/api dev:test",
      url: "http://localhost:3001/api/v1/health",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter @onboarding/web dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
