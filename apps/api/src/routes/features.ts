import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import {
  ErrorCode,
  SECTION_ORDER,
  createFeatureRequestSchema,
  slugSchema,
  type CreateFeatureRequest,
  type FeatureResponse,
  type SectionResponse,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { requireAuthor } from "../middleware/requireAuthor.js";
import { zodValidate } from "../middleware/zodValidate.js";
import { FeatureSlugConflictError, type FeatureRepo } from "../repos/featureRepo.js";
import type { ProjectRepo } from "../repos/projectRepo.js";
import type { Feature } from "../db/schema.js";

export interface FeaturesRouterDeps {
  featureRepo: FeatureRepo;
  projectRepo: ProjectRepo;
  requireAuth: RequestHandler;
  requireAdmin: RequestHandler;
}

function toFeatureResponse(row: Feature): FeatureResponse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createFeaturesRouter(deps: FeaturesRouterDeps): ExpressRouter {
  const { featureRepo, projectRepo, requireAuth, requireAdmin } = deps;
  const router = Router({ mergeParams: true });

  const getParams = z.object({
    slug: slugSchema,
    featureSlug: slugSchema,
  });
  const postParams = z.object({ slug: slugSchema });

  const create: RequestHandler = async (req, res, next) => {
    try {
      const { slug: projectSlug } = req.params as { slug: string };
      const body = req.body as CreateFeatureRequest;

      const project = await projectRepo.findBySlug(projectSlug);
      if (!project) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
        return;
      }

      const feature = await featureRepo.create({
        projectId: project.id,
        slug: body.slug,
        title: body.title,
      });
      res.status(201).json({ data: toFeatureResponse(feature) });
    } catch (err) {
      if (err instanceof FeatureSlugConflictError) {
        next(
          new HttpError(
            409,
            ErrorCode.FEATURE_SLUG_TAKEN,
            "Feature slug đã tồn tại trong project này",
          ),
        );
        return;
      }
      next(err);
    }
  };

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
          updatedByName: row?.updatedByName ?? null,
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

  const archive: RequestHandler = async (req, res, next) => {
    try {
      const { slug, featureSlug } = req.params as { slug: string; featureSlug: string };
      const ok = await featureRepo.archive(slug, featureSlug);
      if (!ok) {
        next(new HttpError(404, ErrorCode.FEATURE_NOT_FOUND, "Feature không tồn tại"));
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  router.post(
    "/",
    requireAuth,
    requireAuthor,
    zodValidate({ params: postParams, body: createFeatureRequestSchema }),
    create,
  );
  router.get("/:featureSlug", requireAuth, zodValidate({ params: getParams }), get);
  router.post(
    "/:featureSlug/archive",
    requireAuth,
    requireAdmin,
    zodValidate({ params: getParams }),
    archive,
  );
  return router;
}
