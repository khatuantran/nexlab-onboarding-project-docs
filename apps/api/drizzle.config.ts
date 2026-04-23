import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import type { Config } from "drizzle-kit";

// Load apps/api/.env anchored via import.meta.url (CR-001, amended).
// Drizzle CLI may run with any cwd; explicit path keeps it deterministic.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env"),
});

/**
 * Drizzle-kit config — used by `pnpm db:generate` + `pnpm db:migrate`.
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
