import Redis from "ioredis";
import { config } from "./config.js";
import { logger } from "./logger.js";
import type { HealthStatus } from "./routes/health.js";

/**
 * Production deployment: Upstash Redis URL of the form
 *   rediss://default:<token>@<endpoint>.upstash.io:6379
 * The `rediss://` scheme tells ioredis to negotiate TLS automatically;
 * no extra `tls: {}` option needed. (CR-003 / ADR-002.)
 *
 * Tunables:
 * - lazyConnect avoids dialing Redis at module-load (faster boot when
 *   Upstash is briefly unreachable; first command triggers connect).
 * - enableOfflineQueue=false → fail-fast if Redis is down rather than
 *   buffering session/rate-limit writes that may apply stale.
 * - keepAlive 30s keeps the pooled TCP connection alive between
 *   sparse pilot traffic so we don't pay TLS handshake on every
 *   request after idle.
 */
export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  keepAlive: 30_000,
});

redis.on("error", (err) => {
  logger.warn({ err }, "Redis client error");
});

export async function redisCheck(): Promise<HealthStatus> {
  try {
    const pong = await redis.ping();
    return pong === "PONG" ? "ok" : "error";
  } catch (err) {
    logger.warn({ err }, "redisCheck failed");
    return "error";
  }
}
