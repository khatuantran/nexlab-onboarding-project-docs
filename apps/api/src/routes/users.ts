import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  ErrorCode,
  inviteUserRequestSchema,
  type AdminUser,
  type InviteUserRequest,
  type UserPublic,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { logger } from "../logger.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { zodValidate } from "../middleware/zodValidate.js";
import { generateTempPassword } from "../lib/tempPassword.js";
import type { AdminUserRow, UserRepo } from "../repos/userRepo.js";

const BCRYPT_COST = 12;

export interface UsersRouterDeps {
  userRepo: UserRepo;
  requireAuth: RequestHandler;
}

const querySchema = z.object({
  q: z.string().max(100).optional(),
  role: z.enum(["admin", "author"]).optional(),
  status: z.enum(["active", "archived", "all"]).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

export function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * US-007 — admin user lifecycle (list + detail in this file; mutation
 * routes wired in later tasks). Non-admin callers see the public shape
 * (id + displayName + role) for the author-filter dropdown; admin sees
 * the AdminUser shape (+ email, archivedAt, lastLoginAt, createdAt).
 *
 * Original US-005 / FR-USER-001 contract preserved for non-admin callers.
 */
export function createUsersRouter(deps: UsersRouterDeps): ExpressRouter {
  const { userRepo, requireAuth } = deps;
  const router = Router();

  const list: RequestHandler = async (req, res, next) => {
    try {
      const { q, role, status } = req.query as z.infer<typeof querySchema>;
      const isAdmin = req.user?.role === "admin";
      if (status && status !== "active" && !isAdmin) {
        next(new HttpError(403, ErrorCode.FORBIDDEN, "Chỉ admin được xem user archived"));
        return;
      }
      const rows = await userRepo.listUsers({
        q,
        role,
        status: status ?? "active",
        includeAdminFields: isAdmin,
      });
      if (isAdmin) {
        const data: AdminUser[] = (rows as AdminUserRow[]).map(toAdminUser);
        res.status(200).json({ data });
      } else {
        const data: UserPublic[] = rows as UserPublic[];
        res.status(200).json({ data });
      }
    } catch (err) {
      next(err);
    }
  };

  const getById: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const row = await userRepo.getAdminById(id);
      if (!row) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      res.status(200).json({ data: toAdminUser(row) });
    } catch (err) {
      next(err);
    }
  };

  const invite: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as InviteUserRequest;
      const actorId = req.user?.id;
      if (!actorId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const existing = await userRepo.findByEmail(body.email);
      if (existing) {
        next(new HttpError(409, ErrorCode.USER_EMAIL_EXISTS, "Email đã được dùng cho user khác"));
        return;
      }
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_COST);
      const row = await userRepo.createUser({
        email: body.email.toLowerCase(),
        displayName: body.displayName,
        role: body.role,
        passwordHash,
      });
      logger.info(
        { event: "user.invited", actorId, newUserId: row.id, role: row.role },
        "admin invited user",
      );
      res.status(201).json({ data: { user: toAdminUser(row), tempPassword } });
    } catch (err) {
      next(err);
    }
  };

  router.get("/", requireAuth, zodValidate({ query: querySchema }), list);
  router.post(
    "/",
    requireAuth,
    requireAdmin,
    zodValidate({ body: inviteUserRequestSchema }),
    invite,
  );
  router.get("/:id", requireAuth, requireAdmin, zodValidate({ params: idParamSchema }), getById);
  return router;
}
