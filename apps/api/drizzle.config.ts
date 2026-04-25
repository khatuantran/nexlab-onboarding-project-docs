import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import type { Config } from "drizzle-kit";

// Load apps/api/.env anchored via import.meta.url (CR-001, amended).
// Drizzle CLI may run with any cwd; explicit path keeps it deterministic.
const apiDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(apiDir, ".env") });

// APP_ENV=test → overlay .env.test so `pnpm db:migrate:test` writes to
// the isolated `onboardingdb_test` database.
if (process.env.APP_ENV === "test") {
  dotenv.config({ path: path.resolve(apiDir, ".env.test"), override: true });
}

/**
 * Drizzle-kit config — used by `pnpm db:generate` + `pnpm db:migrate`.
 * Set APP_ENV=test to target the isolated test database.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://dev:dev@localhost:5432/onboardingdb",
  },
  verbose: true,
  strict: true,
} satisfies Config;
