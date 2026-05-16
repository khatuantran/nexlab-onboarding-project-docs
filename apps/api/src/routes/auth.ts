import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import bcrypt from "bcryptjs";
import { ErrorCode, loginRequestSchema, type AuthUser } from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { zodValidate } from "../middleware/zodValidate.js";
import type { UserRepo } from "../repos/userRepo.js";
import type { User } from "../db/schema.js";

export interface AuthRouterDeps {
  userRepo: UserRepo;
  loginRateLimit: RequestHandler;
}

function toAuthUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    avatarUrl: u.avatarUrl ?? null,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    phone: u.phone ?? null,
    department: u.department ?? null,
    location: u.location ?? null,
    bio: u.bio ?? null,
  };
}

/**
 * Auth endpoints. Session-cookie based (httpOnly `sid`); login sets
 * `req.session.userId`, logout destroys the session. Wrong email and
 * wrong password return the same `INVALID_CREDENTIALS` to avoid
 * account enumeration.
 */
export function createAuthRouter(deps: AuthRouterDeps): ExpressRouter {
  const { userRepo, loginRateLimit } = deps;
  const router = Router();

  const login: RequestHandler = async (req, res, next) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const user = await userRepo.findByEmail(email);

      const hash =
        user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali";
      const ok = await bcrypt.compare(password, hash);

      if (!user || !ok) {
        next(new HttpError(401, ErrorCode.INVALID_CREDENTIALS, "Email hoặc mật khẩu không đúng"));
        return;
      }

      // US-007 — disabled accounts cannot start a new session. Done AFTER
      // password verification so a wrong password on a disabled account
      // still returns INVALID_CREDENTIALS (no enumeration via 403).
      if (user.archivedAt !== null) {
        next(
          new HttpError(403, ErrorCode.USER_DISABLED, "Tài khoản đã bị vô hiệu hoá, liên hệ admin"),
        );
        return;
      }

      req.session.userId = user.id;
      // Fire-and-forget; failure to stamp last_login_at should not block login.
      void userRepo.touchLastLogin(user.id).catch(() => undefined);
      res.status(200).json({ data: { user: toAuthUser(user) } });
    } catch (err) {
      next(err);
    }
  };

  const logout: RequestHandler = (req, res, next) => {
    req.session.destroy((err) => {
      if (err) {
        next(err);
        return;
      }
      res.clearCookie("sid");
      res.status(204).end();
    });
  };

  const me: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const user = await userRepo.findById(userId);
      if (!user || user.archivedAt !== null) {
        req.session.destroy(() => undefined);
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      res.status(200).json({ data: { user: toAuthUser(user) } });
    } catch (err) {
      next(err);
    }
  };

  router.post("/login", loginRateLimit, zodValidate({ body: loginRequestSchema }), login);
  router.post("/logout", logout);
  router.get("/me", me);

  return router;
}
