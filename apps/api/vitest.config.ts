import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * API test config: load `apps/api/.env.local` (CR-001) into `process.env`
 * so integration tests can reach Postgres + Redis on their overridden
 * ports. Plain-text parser to avoid pulling dotenv into vitest config.
 */
function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, ".env.local");
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
    // .env.local optional — devs without it run via CI env.
  }
  return out;
}

export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    reporters: ["default"],
    env: loadEnvLocal(),
  },
});
