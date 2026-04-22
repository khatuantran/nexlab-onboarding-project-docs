import crypto from "node:crypto";
import express, { type Express } from "express";
import pinoHttp from "pino-http";
import cors from "cors";
import { logger } from "./logger.js";
import { config } from "./config.js";
import { createHealthRouter, type HealthDeps } from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./errors.js";

export type AppDeps = HealthDeps & {
  /**
   * Optional session middleware. Tests omit; real bootstrap passes
   * `createSessionMiddleware()`. Keeps test app lightweight (no Redis
   * connect attempt during unit tests).
   */
  sessionMiddleware?: express.RequestHandler;
};

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = req.headers["x-request-id"];
        const id = typeof existing === "string" && existing ? existing : crypto.randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "256kb" }));

  if (deps.sessionMiddleware) {
    app.use(deps.sessionMiddleware);
  }

  const v1 = express.Router();
  v1.use("/health", createHealthRouter(deps));

  app.use("/api/v1", v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
