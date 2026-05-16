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
  /**
   * Optional auth router (mounted at `/api/v1/auth`). Injected so
   * the router can carry its own deps (user repo + rate limiter)
   * without `createApp` reaching into storage.
   */
  authRouter?: express.Router;
  /**
   * Read-side routers. Mounted at `/projects`, `/projects/:slug/features`,
   * `/search`. Each carries its own repo + auth guard via factory.
   */
  projectsRouter?: express.Router;
  featuresRouter?: express.Router;
  sectionsRouter?: express.Router;
  searchRouter?: express.Router;
  usersRouter?: express.Router;
  uploadsRouter?: express.Router;
  meRouter?: express.Router;
  workspaceRouter?: express.Router;
};

/**
 * Parse the CORS_ORIGIN env into an allowlist (comma-separated). The
 * cors middleware accepts a callback that returns boolean per request;
 * we whitelist exact-match origins and let server-to-server / curl
 * (no Origin header) through. Production deployment per CR-003 sets
 * CORS_ORIGIN to the Netlify site URL.
 */
function parseCorsAllowlist(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  // Trust the first proxy hop so req.ip + req.protocol reflect the
  // client behind Fly.io's edge (CR-003 / ADR-002). Required for
  // express-session cookie `secure` semantics + rate-limit IP keying.
  app.set("trust proxy", 1);

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

  const corsAllowlist = parseCorsAllowlist(config.CORS_ORIGIN);
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow same-origin / non-browser clients (no Origin header).
        if (!origin) return cb(null, true);
        if (corsAllowlist.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "256kb" }));

  if (deps.sessionMiddleware) {
    app.use(deps.sessionMiddleware);
  }

  const v1 = express.Router();
  v1.use("/health", createHealthRouter(deps));
  if (deps.authRouter) {
    v1.use("/auth", deps.authRouter);
  }
  if (deps.projectsRouter) {
    v1.use("/projects", deps.projectsRouter);
  }
  if (deps.featuresRouter) {
    v1.use("/projects/:slug/features", deps.featuresRouter);
  }
  if (deps.sectionsRouter) {
    v1.use("/features", deps.sectionsRouter);
  }
  if (deps.uploadsRouter) {
    v1.use("/features", deps.uploadsRouter);
  }
  if (deps.searchRouter) {
    v1.use("/search", deps.searchRouter);
  }
  if (deps.usersRouter) {
    v1.use("/users", deps.usersRouter);
  }
  if (deps.meRouter) {
    v1.use("/me", deps.meRouter);
  }
  if (deps.workspaceRouter) {
    v1.use("/workspace", deps.workspaceRouter);
  }

  app.use("/api/v1", v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
