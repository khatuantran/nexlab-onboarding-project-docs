import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import { zodValidate } from "../middleware/zodValidate.js";
import type { UserRepo } from "../repos/userRepo.js";

export interface UsersRouterDeps {
  userRepo: UserRepo;
  requireAuth: RequestHandler;
}

const querySchema = z.object({
  q: z.string().max(100).optional(),
  role: z.enum(["admin", "author"]).optional(),
});

/**
 * US-005 / FR-USER-001 — author filter dropdown.
 *
 * Returns up to 50 users (id + displayName + role only) for use in the
 * search UI. Email and passwordHash are intentionally excluded — internal
 * portal access model (FR-PROJ-001) lets every authenticated user see
 * other users' display names, but PII fields stay scoped to /auth/me +
 * admin invite endpoints.
 */
export function createUsersRouter(deps: UsersRouterDeps): ExpressRouter {
  const { userRepo, requireAuth } = deps;
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const { q, role } = req.query as z.infer<typeof querySchema>;
      const data = await userRepo.listUsers({ q, role });
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  router.get("/", requireAuth, zodValidate({ query: querySchema }), handler);
  return router;
}
