import crypto from "node:crypto";
import express, { type Express } from "express";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";
import { createHealthRouter, type HealthDeps } from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./errors.js";

export type AppDeps = HealthDeps;

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

  app.use(express.json({ limit: "256kb" }));

  const v1 = express.Router();
  v1.use("/health", createHealthRouter(deps));

  app.use("/api/v1", v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
