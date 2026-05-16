import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import multer, { MulterError } from "multer";
import { fileTypeFromBuffer } from "file-type";
import type Redis from "ioredis";
import {
  ErrorCode,
  UPLOAD_MIME_WHITELIST,
  activityQuerySchema,
  changePasswordRequestSchema,
  recentProjectsQuerySchema,
  updateMyProfileRequestSchema,
  updateSkillsRequestSchema,
  type ActivityQuery,
  type AuthUser,
  type ChangePasswordRequest,
  type RecentProjectsQuery,
  type UpdateMyProfileRequest,
  type UpdateSkillsRequest,
  type UploadMimeType,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { zodValidate } from "../middleware/zodValidate.js";
import { purgeSessionsForUserExcept } from "../lib/sessionPurge.js";
import type { CloudinaryClient } from "../lib/cloudinary.js";
import type { UserRepo, AdminUserRow } from "../repos/userRepo.js";
import type { UserSkillsRepo } from "../repos/userSkillsRepo.js";
import type { UserStatsRepo } from "../repos/userStatsRepo.js";

/** US-009 — bcrypt cost matches users.ts admin invite/reset for consistency. */
const BCRYPT_COST = 12;
/** Avatar files are kept small (2 MB) — UI is a small circle, large originals waste bandwidth. */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export interface MeRouterDeps {
  userRepo: UserRepo;
  userStatsRepo: UserStatsRepo;
  userSkillsRepo: UserSkillsRepo;
  requireAuth: RequestHandler;
  redis: Pick<Redis, "scan" | "get" | "del">;
  cloudinary: CloudinaryClient;
  /** Cloudinary folder for avatars, e.g. "onboarding-portal/dev/avatars". */
  cloudinaryAvatarsFolder: string;
}

function isWhitelistedMime(mime: string): mime is UploadMimeType {
  return (UPLOAD_MIME_WHITELIST as readonly string[]).includes(mime);
}

function toAuthUser(row: AdminUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    avatarUrl: row.avatarUrl,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    phone: row.phone,
    department: row.department,
    location: row.location,
    bio: row.bio,
  };
}

export function createMeRouter(deps: MeRouterDeps): ExpressRouter {
  const {
    userRepo,
    userStatsRepo,
    userSkillsRepo,
    requireAuth,
    redis,
    cloudinary,
    cloudinaryAvatarsFolder,
  } = deps;
  const router = Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
  });

  const multerSingle: RequestHandler = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(new HttpError(413, ErrorCode.FILE_TOO_LARGE, "File quá lớn (max 2 MB)"));
          return;
        }
        next(new HttpError(400, ErrorCode.VALIDATION_ERROR, err.message));
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  };

  const getMe: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const row = await userRepo.getAdminById(userId);
      if (!row) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      res.status(200).json({ data: toAuthUser(row) });
    } catch (err) {
      next(err);
    }
  };

  const patchMe: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const body = req.body as UpdateMyProfileRequest;
      const row = await userRepo.updateUser(userId, {
        displayName: body.displayName,
        phone: body.phone,
        department: body.department,
        location: body.location,
        bio: body.bio,
      });
      if (!row) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      res.status(200).json({ data: toAuthUser(row) });
    } catch (err) {
      next(err);
    }
  };

  const changePassword: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const body = req.body as ChangePasswordRequest;
      const user = await userRepo.findById(userId);
      if (!user) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const ok = await bcrypt.compare(body.oldPassword, user.passwordHash);
      if (!ok) {
        next(new HttpError(401, ErrorCode.INVALID_CREDENTIALS, "Mật khẩu cũ không đúng"));
        return;
      }
      const newHash = await bcrypt.hash(body.newPassword, BCRYPT_COST);
      await userRepo.updatePasswordHash(userId, newHash);
      // Preserve the caller's current session; kick every other device.
      const currentSid = req.sessionID ?? null;
      await purgeSessionsForUserExcept(redis, userId, currentSid);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  const uploadAvatar: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }

      const file = req.file;
      if (!file) {
        next(
          new HttpError(400, ErrorCode.VALIDATION_ERROR, "Thiếu field 'file' trong multipart body"),
        );
        return;
      }

      const sniffed = await fileTypeFromBuffer(file.buffer);
      const realMime = sniffed?.mime;
      if (!realMime || !isWhitelistedMime(realMime)) {
        next(
          new HttpError(
            415,
            ErrorCode.UNSUPPORTED_MEDIA_TYPE,
            "Chỉ chấp nhận png, jpg, webp",
            sniffed ? { detectedMime: sniffed.mime } : undefined,
          ),
        );
        return;
      }

      if (!cloudinary.isConfigured()) {
        next(
          new HttpError(
            503,
            ErrorCode.UPLOADS_DISABLED,
            "Upload tạm thời không khả dụng (Cloudinary chưa cấu hình)",
          ),
        );
        return;
      }

      const id = crypto.randomUUID();
      const publicId = `${cloudinaryAvatarsFolder}/${id}`;

      let cloudinaryResult;
      try {
        cloudinaryResult = await cloudinary.uploadImage({
          buffer: file.buffer,
          publicId,
          filename: file.originalname,
        });
      } catch (err) {
        next(
          new HttpError(
            502,
            ErrorCode.UPLOAD_PROVIDER_ERROR,
            "Upload provider trả lỗi, thử lại sau",
            { cause: err instanceof Error ? err.message : String(err) },
          ),
        );
        return;
      }

      const row = await userRepo.updateAvatarUrl(userId, cloudinaryResult.secureUrl);
      if (!row) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      res.status(200).json({ data: { avatarUrl: cloudinaryResult.secureUrl } });
    } catch (err) {
      next(err);
    }
  };

  const getStats: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const data = await userStatsRepo.getStatsForUser(userId);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  const getRecentProjects: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const { limit } = req.query as unknown as RecentProjectsQuery;
      const data = await userStatsRepo.getRecentProjectsForUser(userId, limit);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  const getActivity: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const { limit, cursor } = req.query as unknown as ActivityQuery;
      const data = await userStatsRepo.getActivityForUser(userId, {
        limit,
        cursor: cursor ? new Date(cursor) : null,
      });
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  router.get("/", requireAuth, getMe);
  router.patch("/", requireAuth, zodValidate({ body: updateMyProfileRequestSchema }), patchMe);
  router.get("/stats", requireAuth, getStats);
  router.get(
    "/recent-projects",
    requireAuth,
    zodValidate({ query: recentProjectsQuerySchema }),
    getRecentProjects,
  );
  router.get("/activity", requireAuth, zodValidate({ query: activityQuerySchema }), getActivity);

  const getSkills: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const data = await userSkillsRepo.getForUser(userId);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  const putSkills: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }
      const body = req.body as UpdateSkillsRequest;
      const data = await userSkillsRepo.replaceAll(userId, body.skills);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  };

  router.get("/skills", requireAuth, getSkills);
  router.put("/skills", requireAuth, zodValidate({ body: updateSkillsRequestSchema }), putSkills);
  router.post(
    "/password",
    requireAuth,
    zodValidate({ body: changePasswordRequestSchema }),
    changePassword,
  );
  router.post("/avatar", requireAuth, multerSingle, uploadAvatar);
  return router;
}
