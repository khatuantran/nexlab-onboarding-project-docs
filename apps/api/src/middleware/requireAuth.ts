import type { Request, RequestHandler } from "express";
import { HttpError } from "../errors.js";
import { ErrorCode } from "@onboarding/shared";

/**
 * Stub requireAuth — rejects 401 UNAUTHENTICATED if no session.userId.
 *
 * T3 provides the session-check contract only; T6 extends this by
 * also querying the users table and attaching `req.user` after a
 * successful login flow lands.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const session = (req as Request & { session?: { userId?: string } }).session;
  if (!session?.userId) {
    next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
    return;
  }
  next();
};
