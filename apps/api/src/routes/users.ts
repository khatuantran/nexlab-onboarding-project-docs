import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  ErrorCode,
  inviteUserRequestSchema,
  updateUserRequestSchema,
  type AdminUser,
  type InviteUserRequest,
  type UpdateUserRequest,
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
  /**
   * Invalidate every active session belonging to a user. Optional so
   * the test app may pass a no-op fake (Redis not wired in tests).
   * Production wiring: `purgeSessionsForUser(redis, userId)`.
   */
  purgeUserSessions?: (userId: string) => Promise<unknown>;
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
    avatarUrl: row.avatarUrl,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    phone: row.phone,
    department: row.department,
    location: row.location,
    bio: row.bio,
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
  const { userRepo, requireAuth, purgeUserSessions } = deps;
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

  /**
   * Last-admin guard. Returns true when archiving/demoting `targetId`
   * would leave zero active admins. Skips the count when `targetId` is
   * not currently an admin (cheap fast-path).
   */
  async function wouldOrphanAdmins(targetId: string): Promise<boolean> {
    const target = await userRepo.getAdminById(targetId);
    if (!target || target.role !== "admin" || target.archivedAt !== null) return false;
    const remaining = await userRepo.countActiveAdmins();
    return remaining <= 1;
  }

  const patch: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as UpdateUserRequest;
      const actorId = req.user?.id;
      if (actorId === id) {
        next(
          new HttpError(
            409,
            ErrorCode.CANNOT_MODIFY_SELF,
            "Không thể thực hiện thao tác này lên chính tài khoản của bạn",
          ),
        );
        return;
      }
      const existing = await userRepo.getAdminById(id);
      if (!existing) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      // Demoting the last admin → block.
      if (body.role && body.role !== "admin" && (await wouldOrphanAdmins(id))) {
        next(
          new HttpError(
            409,
            ErrorCode.LAST_ADMIN_PROTECTED,
            "Không thể demote admin cuối cùng trong hệ thống",
          ),
        );
        return;
      }
      const updated = await userRepo.updateUser(id, body);
      if (!updated) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      logger.info(
        { event: "user.updated", actorId, targetId: id, patch: body },
        "admin updated user",
      );
      res.status(200).json({ data: toAdminUser(updated) });
    } catch (err) {
      next(err);
    }
  };

  const archive: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const actorId = req.user?.id;
      if (actorId === id) {
        next(
          new HttpError(
            409,
            ErrorCode.CANNOT_MODIFY_SELF,
            "Không thể disable chính tài khoản của bạn",
          ),
        );
        return;
      }
      const existing = await userRepo.getAdminById(id);
      if (!existing) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      // Idempotent — re-archiving an already-archived user just returns it.
      if (existing.archivedAt !== null) {
        res.status(200).json({ data: toAdminUser(existing) });
        return;
      }
      if (await wouldOrphanAdmins(id)) {
        next(
          new HttpError(
            409,
            ErrorCode.LAST_ADMIN_PROTECTED,
            "Không thể disable admin cuối cùng trong hệ thống",
          ),
        );
        return;
      }
      const updated = await userRepo.setArchived(id, true);
      if (!updated) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      logger.info({ event: "user.archived", actorId, targetId: id }, "admin archived user");
      res.status(200).json({ data: toAdminUser(updated) });
    } catch (err) {
      next(err);
    }
  };

  const unarchive: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const actorId = req.user?.id;
      const existing = await userRepo.getAdminById(id);
      if (!existing) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      if (existing.archivedAt === null) {
        res.status(200).json({ data: toAdminUser(existing) });
        return;
      }
      const updated = await userRepo.setArchived(id, false);
      if (!updated) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      logger.info({ event: "user.unarchived", actorId, targetId: id }, "admin unarchived user");
      res.status(200).json({ data: toAdminUser(updated) });
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
  router.patch(
    "/:id",
    requireAuth,
    requireAdmin,
    zodValidate({ params: idParamSchema, body: updateUserRequestSchema }),
    patch,
  );
  router.post(
    "/:id/archive",
    requireAuth,
    requireAdmin,
    zodValidate({ params: idParamSchema }),
    archive,
  );
  const resetPassword: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const actorId = req.user?.id;
      if (actorId === id) {
        next(
          new HttpError(
            409,
            ErrorCode.CANNOT_MODIFY_SELF,
            "Không thể reset mật khẩu của chính tài khoản của bạn",
          ),
        );
        return;
      }
      const existing = await userRepo.getAdminById(id);
      if (!existing) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_COST);
      const updated = await userRepo.updatePasswordHash(id, passwordHash);
      if (!updated) {
        next(new HttpError(404, ErrorCode.USER_NOT_FOUND, "User không tồn tại"));
        return;
      }
      // Best-effort session purge — failure logs but does not block the
      // admin from returning the new credential. Worst case the target
      // user stays logged in until cookie TTL; they can still authenticate
      // with the new password on the next explicit login.
      if (purgeUserSessions) {
        try {
          await purgeUserSessions(id);
        } catch (err) {
          logger.warn({ err, targetId: id }, "session purge failed during password reset");
        }
      }
      logger.info(
        { event: "user.password_reset", actorId, targetId: id },
        "admin reset user password",
      );
      res.status(200).json({ data: { user: toAdminUser(updated), tempPassword } });
    } catch (err) {
      next(err);
    }
  };

  router.post(
    "/:id/unarchive",
    requireAuth,
    requireAdmin,
    zodValidate({ params: idParamSchema }),
    unarchive,
  );
  router.post(
    "/:id/reset-password",
    requireAuth,
    requireAdmin,
    zodValidate({ params: idParamSchema }),
    resetPassword,
  );
  return router;
}
