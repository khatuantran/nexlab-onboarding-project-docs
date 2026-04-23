import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import {
  ErrorCode,
  createProjectRequestSchema,
  slugSchema,
  type CreateProjectRequest,
  type FeatureListItem,
  type ProjectResponse,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { zodValidate } from "../middleware/zodValidate.js";
import { SlugConflictError, type ProjectRepo } from "../repos/projectRepo.js";
import type { Project } from "../db/schema.js";

export interface ProjectsRouterDeps {
  projectRepo: ProjectRepo;
  requireAuth: RequestHandler;
}

function toProjectResponse(row: Project): ProjectResponse {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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
        project: toProjectResponse(project),
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

  const create: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as CreateProjectRequest;
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const project = await projectRepo.create({
        slug: body.slug,
        name: body.name,
        description: body.description ?? null,
        createdBy: userId,
      });
      res.status(201).json({ data: toProjectResponse(project) });
    } catch (err) {
      if (err instanceof SlugConflictError) {
        next(new HttpError(409, ErrorCode.PROJECT_SLUG_TAKEN, "Slug đã được dùng, chọn slug khác"));
        return;
      }
      next(err);
    }
  };

  router.post(
    "/",
    requireAuth,
    requireAdmin,
    zodValidate({ body: createProjectRequestSchema }),
    create,
  );
  router.get("/:slug", requireAuth, zodValidate({ params }), getBySlug);
  return router;
}
