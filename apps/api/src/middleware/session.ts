import session from "express-session";
import { RedisStore } from "connect-redis";
import type { RequestHandler } from "express";
import { config } from "../config.js";
import { redis } from "../redis.js";

/**
 * Session middleware factory.
 * - Store: Redis via connect-redis (survives app restart; invalidation instant).
 * - Cookie: `sid`, httpOnly, sameSite=lax, secure trong prod.
 * - TTL: 7 ngày sliding (SESSION_TTL_SECONDS trong env).
 *
 * Wired vào `createApp` ở T3; endpoints `/auth/*` viết ở T6.
 */
export function createSessionMiddleware(): RequestHandler {
  const store = new RedisStore({
    client: redis,
    prefix: "sess:",
  });

  const sessionTtlSeconds = 7 * 24 * 60 * 60; // 7 days

  return session({
    store,
    name: "sid",
    secret: config.SESSION_SECRET ?? "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    rolling: true, // refresh maxAge on every authenticated request
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
      maxAge: sessionTtlSeconds * 1000,
    },
  });
}

// Augment Express session shape so TS knows about userId.
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
