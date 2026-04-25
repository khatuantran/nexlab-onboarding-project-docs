import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import { ErrorCode, featureStatusSchema, sectionTypeSchema, slugSchema } from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { zodValidate } from "../middleware/zodValidate.js";
import type { SearchRepo } from "../repos/searchRepo.js";

export interface SearchRouterDeps {
  searchRepo: SearchRepo;
  requireAuth: RequestHandler;
}

/**
 * US-005 v2: response shape changed from flat `data: SearchHit[]` to grouped
 * `data: SearchResultsV2`. Filter params (sectionTypes / authorId /
 * updatedSince / status) are validated by Zod; the explicit
 * SEARCH_QUERY_EMPTY / SEARCH_QUERY_TOO_LONG codes are still raised in the
 * handler (Zod returns the generic VALIDATION_ERROR for shape problems but
 * the spec wants the specific codes for the q field).
 */
const querySchema = z.object({
  q: z.string().optional(),
  projectSlug: slugSchema.optional(),
  sectionTypes: z
    .string()
    .optional()
    .transform((raw) => {
      if (!raw) return undefined;
      const parts = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return parts.length === 0 ? undefined : parts;
    })
    .pipe(z.array(sectionTypeSchema).optional()),
  authorId: z.string().uuid().optional(),
  updatedSince: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  status: featureStatusSchema.optional(),
});

export function createSearchRouter(deps: SearchRouterDeps): ExpressRouter {
  const { searchRepo, requireAuth } = deps;
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const parsed = req.query as z.infer<typeof querySchema>;
      const trimmed = (parsed.q ?? "").trim();
      if (trimmed.length === 0) {
        next(new HttpError(400, ErrorCode.SEARCH_QUERY_EMPTY, "Query không được rỗng"));
        return;
      }
      if (trimmed.length > 200) {
        next(new HttpError(400, ErrorCode.SEARCH_QUERY_TOO_LONG, "Query quá dài"));
        return;
      }
      const data = await searchRepo.searchAll(trimmed, {
        projectSlug: parsed.projectSlug,
        sectionTypes: parsed.sectionTypes,
        authorId: parsed.authorId,
        updatedSince: parsed.updatedSince,
        status: parsed.status,
      });
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  router.get("/", requireAuth, zodValidate({ query: querySchema }), handler);
  return router;
}
