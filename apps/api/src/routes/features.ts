import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import {
  ErrorCode,
  SECTION_ORDER,
  slugSchema,
  type FeatureResponse,
  type SectionResponse,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { zodValidate } from "../middleware/zodValidate.js";
import type { FeatureRepo } from "../repos/featureRepo.js";

export interface FeaturesRouterDeps {
  featureRepo: FeatureRepo;
  requireAuth: RequestHandler;
}

export function createFeaturesRouter(deps: FeaturesRouterDeps): ExpressRouter {
  const { featureRepo, requireAuth } = deps;
  const router = Router({ mergeParams: true });

  const params = z.object({
    slug: slugSchema,
    featureSlug: slugSchema,
  });

  const get: RequestHandler = async (req, res, next) => {
    try {
      const { slug, featureSlug } = req.params as { slug: string; featureSlug: string };
      const result = await featureRepo.findByProjectAndSlug(slug, featureSlug);
      if (!result) {
        next(new HttpError(404, ErrorCode.FEATURE_NOT_FOUND, "Feature không tồn tại"));
        return;
      }
      const byType = new Map(result.sections.map((s) => [s.type, s]));
      const ordered: SectionResponse[] = SECTION_ORDER.map((type) => {
        const row = byType.get(type);
        return {
          type,
          body: row?.body ?? "",
          updatedAt: (row?.updatedAt ?? result.feature.updatedAt).toISOString(),
          updatedBy: row?.updatedBy ?? null,
        };
      });
      const feature: FeatureResponse = {
        id: result.feature.id,
        slug: result.feature.slug,
        title: result.feature.title,
        createdAt: result.feature.createdAt.toISOString(),
        updatedAt: result.feature.updatedAt.toISOString(),
      };
      res.status(200).json({ data: { feature, sections: ordered } });
    } catch (err) {
      next(err);
    }
  };

  router.get("/:featureSlug", requireAuth, zodValidate({ params }), get);
  return router;
}
