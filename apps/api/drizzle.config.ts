import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * Drizzle-kit config — used by `pnpm db:generate` + `pnpm db:migrate`.
 * `dotenv/config` loads apps/api/.env.local (CR-001).
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
