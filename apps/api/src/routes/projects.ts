import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import {
  ErrorCode,
  slugSchema,
  type FeatureListItem,
  type ProjectResponse,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { zodValidate } from "../middleware/zodValidate.js";
import type { ProjectRepo } from "../repos/projectRepo.js";

export interface ProjectsRouterDeps {
  projectRepo: ProjectRepo;
  requireAuth: RequestHandler;
}

export function createProjectsRouter(deps: ProjectsRouterDeps): ExpressRouter {
  const { projectRepo, requireAuth } = deps;
  const router = Router();

  const params = z.object({ slug: slugSchema });

  const getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = req.params as { slug: string };
      const project = await projectRepo.findBySlug(slug);
      if (!project) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
        return;
      }
      const featureRows = await projectRepo.listFeatures(project.id);
      const response: { project: ProjectResponse; features: FeatureListItem[] } = {
        project: {
          id: project.id,
          slug: project.slug,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
        features: featureRows.map((f) => ({
          id: f.id,
          slug: f.slug,
          title: f.title,
          filledCount: Number(f.filledCount),
          updatedAt: f.updatedAt.toISOString(),
        })),
      };
      res.status(200).json({ data: response });
    } catch (err) {
      next(err);
    }
  };

  router.get("/:slug", requireAuth, zodValidate({ params }), getBySlug);
  return router;
}
