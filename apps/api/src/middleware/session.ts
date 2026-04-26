import session from "express-session";
import { RedisStore } from "connect-redis";
import type { RequestHandler } from "express";
import { config } from "../config.js";
import { redis } from "../redis.js";

/**
 * Session middleware factory.
 * - Store: Redis via connect-redis (survives app restart; invalidation instant).
 * - Cookie: `sid`, httpOnly. `sameSite` + `secure` switch on NODE_ENV.
 * - TTL: 7 ngày sliding (SESSION_TTL_SECONDS trong env).
 *
 * Cross-site cookie (CR-003 / ADR-002): the production deployment puts
 * the SPA on `*.pages.dev` and the API on `*.fly.dev` — different
 * registrable domains, so the browser treats login XHR as cross-site.
 * `sameSite: "none"` + `secure: true` are required for the session
 * cookie to ride along on those XHR; with `lax` the browser drops the
 * cookie and login appears to silently fail. Dev keeps `lax` so the
 * cookie works over plain http://localhost without needing HTTPS.
 *
 * Wired vào `createApp` ở T3; endpoints `/auth/*` viết ở T6.
 */
export function createSessionMiddleware(): RequestHandler {
  const store = new RedisStore({
    client: redis,
    prefix: "sess:",
  });

  const sessionTtlSeconds = 7 * 24 * 60 * 60; // 7 days
  const isProduction = config.NODE_ENV === "production";

  return session({
    store,
    name: "sid",
    secret: config.SESSION_SECRET ?? "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    rolling: true, // refresh maxAge on every authenticated request
    proxy: isProduction, // honour `X-Forwarded-Proto` from Fly's edge
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
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
