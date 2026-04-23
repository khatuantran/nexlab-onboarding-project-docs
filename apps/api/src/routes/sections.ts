import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import {
  ErrorCode,
  SECTION_ORDER,
  updateSectionRequestSchema,
  type SectionResponse,
  type SectionType,
  type UpdateSectionRequest,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { requireAuthor } from "../middleware/requireAuthor.js";
import { zodValidate } from "../middleware/zodValidate.js";
import type { SectionRepo } from "../repos/sectionRepo.js";

/**
 * 64 KiB byte ceiling. Zod's char-level `.max(65536)` is a safety net,
 * but the real limit is bytes (UTF-8 multi-byte chars blow through the
 * char count). We check bytes before Zod parse so a malicious 20 KB
 * body of 4-byte emoji fails with a coherent 413, not a silent pass.
 */
const MAX_SECTION_BYTES = 64 * 1024;

export interface SectionsRouterDeps {
  sectionRepo: SectionRepo;
  requireAuth: RequestHandler;
}

const byteCheck: RequestHandler = (req, _res, next) => {
  const body = (req.body as { body?: unknown })?.body;
  if (typeof body === "string" && Buffer.byteLength(body, "utf8") > MAX_SECTION_BYTES) {
    next(new HttpError(413, ErrorCode.SECTION_TOO_LARGE, "Nội dung section quá lớn (>64 KiB)"));
    return;
  }
  next();
};

export function createSectionsRouter(deps: SectionsRouterDeps): ExpressRouter {
  const { sectionRepo, requireAuth } = deps;
  const router = Router({ mergeParams: true });

  const params = z.object({
    featureId: z.string().uuid("featureId phải là UUID"),
    type: z.string(),
  });

  const validateType: RequestHandler = (req, _res, next) => {
    const type = (req.params as { type?: string }).type;
    if (!type || !(SECTION_ORDER as readonly string[]).includes(type)) {
      next(
        new HttpError(400, ErrorCode.INVALID_SECTION_TYPE, "Section type không hợp lệ", {
          validTypes: SECTION_ORDER,
        }),
      );
      return;
    }
    next();
  };

  const update: RequestHandler = async (req, res, next) => {
    try {
      const { featureId, type } = req.params as { featureId: string; type: SectionType };
      const body = (req.body as UpdateSectionRequest).body;
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }

      const feature = await sectionRepo.findFeature(featureId);
      if (!feature) {
        next(new HttpError(404, ErrorCode.FEATURE_NOT_FOUND, "Feature không tồn tại"));
        return;
      }

      const row = await sectionRepo.update({ featureId, type, body, updatedBy: userId });
      if (!row) {
        // Section row missing — shouldn't happen post-T3 init, but guard anyway.
        next(new HttpError(404, ErrorCode.FEATURE_NOT_FOUND, "Section không tồn tại"));
        return;
      }

      const response: SectionResponse = {
        type: row.type,
        body: row.body,
        updatedAt: row.updatedAt.toISOString(),
        updatedBy: row.updatedBy,
      };
      res.status(200).json({ data: response });
    } catch (err) {
      next(err);
    }
  };

  router.put(
    "/:featureId/sections/:type",
    requireAuth,
    requireAuthor,
    validateType,
    byteCheck,
    zodValidate({ params, body: updateSectionRequestSchema }),
    update,
  );

  return router;
}
