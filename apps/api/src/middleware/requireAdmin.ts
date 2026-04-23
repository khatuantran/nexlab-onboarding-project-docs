import type { RequestHandler } from "express";
import { ErrorCode } from "@onboarding/shared";
import { HttpError } from "../errors.js";

/**
 * Role gate: must run AFTER `createRequireAuth` so `req.user` is set.
 * Returns 403 when the authenticated user is not an admin.
 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    next(new HttpError(403, ErrorCode.FORBIDDEN, "Chỉ admin được thực hiện thao tác này"));
    return;
  }
  next();
};
