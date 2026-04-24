import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import multer, { MulterError } from "multer";
import { fileTypeFromBuffer } from "file-type";
import {
  ErrorCode,
  UPLOAD_MAX_BYTES,
  UPLOAD_MIME_WHITELIST,
  type UploadMimeType,
  type UploadResponse,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { requireAuthor } from "../middleware/requireAuthor.js";
import type { FeatureRepo } from "../repos/featureRepo.js";
import type { UploadRepo } from "../repos/uploadRepo.js";

export interface UploadsRouterDeps {
  uploadRepo: UploadRepo;
  featureRepo: FeatureRepo;
  requireAuth: RequestHandler;
  uploadDir: string;
}

const MIME_TO_EXT: Record<UploadMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function isWhitelistedMime(mime: string): mime is UploadMimeType {
  return (UPLOAD_MIME_WHITELIST as readonly string[]).includes(mime);
}

export function resolveUploadPath(uploadDir: string, id: string, mime: UploadMimeType): string {
  const ext = MIME_TO_EXT[mime];
  return path.resolve(uploadDir, `${id}.${ext}`);
}

export function createUploadsRouter(deps: UploadsRouterDeps): ExpressRouter {
  const { uploadRepo, featureRepo, requireAuth, uploadDir } = deps;
  const router = Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: UPLOAD_MAX_BYTES, files: 1 },
  });

  const multerSingle: RequestHandler = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(new HttpError(413, ErrorCode.FILE_TOO_LARGE, "File quá lớn (max 5 MiB)"));
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

  const create: RequestHandler = async (req, res, next) => {
    try {
      const { featureId } = req.params as { featureId: string };
      const userId = req.user?.id;
      if (!userId) {
        next(new HttpError(401, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập"));
        return;
      }

      const feature = await featureRepo.findById(featureId);
      if (!feature) {
        next(new HttpError(404, ErrorCode.FEATURE_NOT_FOUND, "Feature không tồn tại"));
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

      const id = crypto.randomUUID();
      const absPath = resolveUploadPath(uploadDir, id, realMime);
      await mkdir(path.dirname(absPath), { recursive: true });
      await writeFile(absPath, file.buffer);

      const row = await uploadRepo.insert({
        id,
        featureId,
        uploadedBy: userId,
        mimeType: realMime,
        sizeBytes: file.size,
        filename: file.originalname,
      });

      const response: UploadResponse = {
        id: row.id,
        url: `/api/v1/uploads/${row.id}`,
        sizeBytes: row.sizeBytes,
        mimeType: row.mimeType as UploadMimeType,
        createdAt: row.createdAt.toISOString(),
      };
      res.status(201).json({ data: response });
    } catch (err) {
      next(err);
    }
  };

  router.post("/:featureId/uploads", requireAuth, requireAuthor, multerSingle, create);

  return router;
}
