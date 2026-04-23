import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import type { Config } from "drizzle-kit";

// Load apps/api/.env.local anchored to this file (CR-001). dotenv/config
// sidecar only reads `.env` from cwd; we need explicit path + `.env.local`.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env.local"),
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
