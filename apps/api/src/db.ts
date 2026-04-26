import pg from "pg";
import { config } from "./config.js";
import { logger } from "./logger.js";
import type { HealthStatus } from "./routes/health.js";

/**
 * Production deployment: Neon Postgres pooled URL of the form
 *   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
 * The pg driver honours `sslmode=require` from the query string. We
 * additionally force `ssl: { rejectUnauthorized: false }` outside dev
 * so misconfiguration (e.g. missing query param) still negotiates TLS
 * rather than silently going plaintext. Neon certificates are publicly
 * trusted, so cert verification is enabled by default; we relax it
 * because some managed providers route through self-signed proxies.
 *
 * Pool size 10 leaves headroom under Neon free tier's 64-connection
 * pooler ceiling — single Fly machine plus migration runs concurrently
 * stay well below the limit. (CR-003 / ADR-002.)
 */
const isProduction = process.env.NODE_ENV === "production";

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected pg pool error");
});

export async function dbCheck(): Promise<HealthStatus> {
  try {
    await pool.query("SELECT 1");
    return "ok";
  } catch (err) {
    logger.warn({ err }, "dbCheck failed");
    return "error";
  }
}
