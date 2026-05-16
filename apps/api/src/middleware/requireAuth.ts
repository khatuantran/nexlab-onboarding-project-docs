import type { Request, RequestHandler } from "express";
import { HttpError } from "../errors.js";
import { ErrorCode, type AuthUser } from "@onboarding/shared";
import type { UserRepo } from "../repos/userRepo.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Session-only gate. Rejects 401 if `req.session.userId` is missing.
 * Does NOT hit the DB — use `createRequireAuth(userRepo)` when the
 * handler needs the full user record on `req.user`.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const session = (req as Request & { session?: { userId?: string } }).session;
  if (!session?.userId) {
    next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
    return;
  }
  next();
};

/**
 * Full auth gate: verify session + load user via repo + attach on
 * `req.user`. If the session points to a deleted user, destroy the
 * session and 401 (same code — the caller doesn't need to distinguish).
 */
export function createRequireAuth(userRepo: UserRepo): RequestHandler {
  return async (req, _res, next) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const user = await userRepo.findById(userId);
      // US-007 — kick disabled users off the session (admin archived them
      // between requests). Treat the same as a deleted user from FE's view.
      if (!user || user.archivedAt !== null) {
        req.session.destroy(() => undefined);
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      req.user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        phone: user.phone ?? null,
        department: user.department ?? null,
        location: user.location ?? null,
        bio: user.bio ?? null,
        coverUrl: user.coverUrl ?? null,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}
