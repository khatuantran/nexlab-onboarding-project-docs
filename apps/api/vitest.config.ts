import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * API test config: load `apps/api/.env` (CR-001, amended) into `process.env`
 * then overlay `.env.test` so integration tests hit the isolated
 * `onboardingdb_test` database. Plain-text parser to avoid pulling
 * dotenv into vitest config.
 */
function parseEnvFile(envPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const content = readFileSync(envPath, "utf8");
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      if (key) out[key] = value;
    }
  } catch {
    // file optional — devs without it run via CI env.
  }
  return out;
}

function loadTestEnv(): Record<string, string> {
  const base = parseEnvFile(path.resolve(__dirname, ".env"));
  const overlay = parseEnvFile(path.resolve(__dirname, ".env.test"));
  return { ...base, ...overlay, APP_ENV: "test" };
}

export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    reporters: ["default"],
    env: loadTestEnv(),
  },
});
