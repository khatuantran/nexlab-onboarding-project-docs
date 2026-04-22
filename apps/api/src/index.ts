import { createApp } from "./app.js";
import { config } from "./config.js";
import { dbCheck, pool } from "./db.js";
import { redis, redisCheck } from "./redis.js";
import { logger } from "./logger.js";
import { createSessionMiddleware } from "./middleware/session.js";

const VERSION = "0.1.0";

const app = createApp({
  dbCheck,
  redisCheck,
  version: VERSION,
  sessionMiddleware: createSessionMiddleware(),
});

const server = app.listen(config.API_PORT, () => {
  logger.info({ port: config.API_PORT, env: config.NODE_ENV }, "API listening");
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "Shutting down");
  server.close();
  await Promise.allSettled([pool.end(), redis.quit()]);
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
