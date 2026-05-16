import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import type { WorkspaceStats } from "@onboarding/shared";
import type { ProjectRepo } from "../repos/projectRepo.js";

export interface WorkspaceRouterDeps {
  projectRepo: ProjectRepo;
  requireAuth: RequestHandler;
}

/**
 * US-014 — workspace aggregate stats backing the HomePage 3-tile hero.
 * 30-day activity window matches the FR-STATS-001 hint.
 */
export function createWorkspaceRouter(deps: WorkspaceRouterDeps): ExpressRouter {
  const { projectRepo, requireAuth } = deps;
  const router = Router();

  const stats: RequestHandler = async (_req, res, next) => {
    try {
      const row = await projectRepo.getWorkspaceStats(30);
      const data: WorkspaceStats = {
        projectCount: row.projectCount,
        featuresDocumented: row.featuresDocumented,
        contributorsActive: row.contributorsActive,
      };
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  router.get("/stats", requireAuth, stats);
  return router;
}
