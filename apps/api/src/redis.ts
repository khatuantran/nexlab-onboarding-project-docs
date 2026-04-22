import Redis from "ioredis";
import { config } from "./config.js";
import { logger } from "./logger.js";
import type { HealthStatus } from "./routes/health.js";

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
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
