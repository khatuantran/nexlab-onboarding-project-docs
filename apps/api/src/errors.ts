import type { ErrorRequestHandler, Request, Response } from "express";
import { logger } from "./logger.js";

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export class HttpError extends Error implements ApiError {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const errorHandler: ErrorRequestHandler = (err, req: Request, res: Response, _next) => {
  const reqId = (req as Request & { id?: string }).id;

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error({ err, reqId }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Có lỗi xảy ra, thử lại" },
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route không tồn tại" },
  });
};
