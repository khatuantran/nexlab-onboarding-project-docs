import pg from "pg";
import { config } from "./config.js";
import { logger } from "./logger.js";
import type { HealthStatus } from "./routes/health.js";

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
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
