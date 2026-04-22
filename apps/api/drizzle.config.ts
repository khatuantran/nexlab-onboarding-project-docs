import type { Config } from "drizzle-kit";

/**
 * Drizzle-kit config — used by `pnpm db:generate` + `pnpm db:migrate`.
 * Reads DATABASE_URL from env (loaded via shell or .env.local).
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
