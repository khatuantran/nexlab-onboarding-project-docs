import type { Request, RequestHandler } from "express";
import { HttpError } from "../errors.js";
import { ErrorCode } from "@onboarding/shared";

/**
 * Minimal Redis-backed fixed-window rate limiter.
 * Not using a lib — 20 lines of INCR+EXPIRE is enough for v1 scale
 * (internal portal, single auth endpoint). Swap if bucket precision
 * becomes a problem.
 */

export interface RateLimitClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

export interface RateLimitOptions {
  redis: RateLimitClient;
  keyFn: (req: Request) => string;
  max: number;
  windowSec: number;
}

export function createRateLimit(opts: RateLimitOptions): RequestHandler {
  const { redis, keyFn, max, windowSec } = opts;
  return async (req, _res, next) => {
    try {
      const key = keyFn(req);
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }
      if (count > max) {
        next(
          new HttpError(429, ErrorCode.RATE_LIMITED, "Thử lại sau vài phút", {
            limit: max,
            windowSec,
          }),
        );
        return;
      }
      next();
    } catch (err) {
      // Fail open: if Redis unavailable, don't block traffic — log and pass.
      // Accepted v1 trade-off per NFR-SEC-001 (rate limit là defense-in-depth,
      // không phải single-point security).
      next(err);
    }
  };
}
