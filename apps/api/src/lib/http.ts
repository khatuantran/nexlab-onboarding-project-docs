import type { Response } from "express";
import type { ApiSuccessShape } from "@onboarding/shared";

/**
 * Success response helper — always wraps payload in `{ data }`.
 * Keeps the response envelope consistent with api-surface.md.
 */
export function ok<T>(res: Response, data: T, status = 200): Response {
  const body: ApiSuccessShape<T> = { data };
  return res.status(status).json(body);
}

/**
 * 204 No Content — for actions without a body (logout, delete).
 */
export function noContent(res: Response): Response {
  return res.status(204).end();
}
