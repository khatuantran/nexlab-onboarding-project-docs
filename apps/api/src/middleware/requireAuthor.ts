import type { RequestHandler } from "express";
import { ErrorCode } from "@onboarding/shared";
import { HttpError } from "../errors.js";

/**
 * Author gate: must run AFTER `createRequireAuth`. Allows both `admin`
 * and `author`. Rejects unknown roles with 403 (defensive — enum only
 * allows the two today, but future roles like `viewer` would land here).
 */
export const requireAuthor: RequestHandler = (req, _res, next) => {
  const role = req.user?.role;
  if (role !== "admin" && role !== "author") {
    next(new HttpError(403, ErrorCode.FORBIDDEN, "Bạn không có quyền tạo/sửa nội dung"));
    return;
  }
  next();
};
