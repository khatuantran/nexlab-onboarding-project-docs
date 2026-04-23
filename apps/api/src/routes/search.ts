import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import { ErrorCode, slugSchema, type SearchHit } from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { zodValidate } from "../middleware/zodValidate.js";
import type { SearchRepo } from "../repos/searchRepo.js";

export interface SearchRouterDeps {
  searchRepo: SearchRepo;
  requireAuth: RequestHandler;
}

/**
 * Search query validation is custom: Zod treats "missing q" as
 * VALIDATION_ERROR by default, but the spec wants the explicit
 * `SEARCH_QUERY_EMPTY` / `SEARCH_QUERY_TOO_LONG` codes. So we only
 * accept the shape via zodValidate, then re-check q length in the
 * handler for the custom error codes.
 */
const querySchema = z.object({
  q: z.string().optional(),
  projectSlug: slugSchema.optional(),
});

export function createSearchRouter(deps: SearchRouterDeps): ExpressRouter {
  const { searchRepo, requireAuth } = deps;
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const { q, projectSlug } = req.query as { q?: string; projectSlug?: string };
      const trimmed = (q ?? "").trim();
      if (trimmed.length === 0) {
        next(new HttpError(400, ErrorCode.SEARCH_QUERY_EMPTY, "Query không được rỗng"));
        return;
      }
      if (trimmed.length > 200) {
        next(new HttpError(400, ErrorCode.SEARCH_QUERY_TOO_LONG, "Query quá dài"));
        return;
      }
      const rows = await searchRepo.search(trimmed, projectSlug);
      const hits: SearchHit[] = rows.map((r) => ({
        projectSlug: r.projectSlug,
        featureSlug: r.featureSlug,
        title: r.title,
        snippet: r.snippet,
        rank: Number(r.rank),
      }));
      res.status(200).json({ data: hits });
    } catch (err) {
      next(err);
    }
  };

  router.get("/", requireAuth, zodValidate({ query: querySchema }), handler);
  return router;
}
