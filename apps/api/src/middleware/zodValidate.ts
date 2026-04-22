import type { RequestHandler } from "express";
import { ZodError, type ZodType } from "zod";
import { HttpError } from "../errors.js";
import { ErrorCode } from "@onboarding/shared";

export interface ZodValidateShapes {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Parse request body/query/params against Zod schemas.
 * On failure: 400 VALIDATION_ERROR with ZodIssue[] in details.
 * On success: replace parsed value on req so downstream handlers see
 * the trimmed/coerced output (matters for z.coerce.number()).
 */
export function zodValidate(shapes: ZodValidateShapes): RequestHandler {
  return (req, _res, next) => {
    try {
      if (shapes.body) req.body = shapes.body.parse(req.body);
      if (shapes.query) req.query = shapes.query.parse(req.query);
      if (shapes.params) req.params = shapes.params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new HttpError(400, ErrorCode.VALIDATION_ERROR, "Dữ liệu không hợp lệ", {
            issues: err.issues,
          }),
        );
        return;
      }
      next(err);
    }
  };
}
