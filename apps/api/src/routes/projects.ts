import crypto from "node:crypto";
import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import multer, { MulterError } from "multer";
import { fileTypeFromBuffer } from "file-type";
import {
  ErrorCode,
  UPLOAD_MIME_WHITELIST,
  createProjectRequestSchema,
  slugSchema,
  updateProjectRequestSchema,
  type ContributorSummary,
  type CreateProjectRequest,
  type FeatureListItem,
  type ProjectResponse,
  type ProjectSummary,
  type UpdateProjectRequest,
  type UploadMimeType,
} from "@onboarding/shared";
import { HttpError } from "../errors.js";
import { requireAdmin as requireAdminDefault } from "../middleware/requireAdmin.js";
import { zodValidate } from "../middleware/zodValidate.js";
import {
  SlugConflictError,
  type ContributorRow,
  type ProjectRepo,
  type ProjectSummaryRow,
} from "../repos/projectRepo.js";
import type { Project } from "../db/schema.js";
import { publicIdFromUrl, type CloudinaryClient } from "../lib/cloudinary.js";
import { logger } from "../logger.js";

/** US-019 — cover ảnh lớn hơn avatar (~2000×860); 4 MB cap. */
const COVER_MAX_BYTES = 4 * 1024 * 1024;

function isWhitelistedMime(mime: string): mime is UploadMimeType {
  return (UPLOAD_MIME_WHITELIST as readonly string[]).includes(mime);
}

export interface ProjectsRouterDeps {
  projectRepo: ProjectRepo;
  requireAuth: RequestHandler;
  /** Optional override (tests); defaults to module-level requireAdmin. */
  requireAdmin?: RequestHandler;
  /** US-019 — cover upload deps; required for `POST /:slug/cover`. */
  cloudinary?: CloudinaryClient;
  cloudinaryProjectCoversFolder?: string;
}

/**
 * US-011 — fetch contributors for a list of feature IDs. Serial loop is
 * acceptable for the typical project (≤ 5-10 features); upgrade to a
 * single batched window query when feature counts grow.
 */
async function getContributorsForFeatures(
  projectRepo: ProjectRepo,
  featureIds: string[],
): Promise<Map<string, ContributorRow[]>> {
  const map = new Map<string, ContributorRow[]>();
  await Promise.all(
    featureIds.map(async (id) => {
      map.set(id, await projectRepo.getContributorsForFeature(id));
    }),
  );
  return map;
}

function toContributorSummary(row: ContributorRow): ContributorSummary {
  return {
    userId: row.userId,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    lastUpdatedAt: row.lastUpdatedAt.toISOString(),
  };
}

function toProjectSummary(row: ProjectSummaryRow, contributors: ContributorRow[]): ProjectSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    featureCount: Number(row.featureCount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    contributors: contributors.map(toContributorSummary),
    repoUrl: row.repoUrl ?? null,
    filledSectionCount: Number(row.filledSectionCount ?? 0),
    coverUrl: row.coverUrl ?? null,
  };
}

function toProjectResponse(row: Project, contributors: ContributorRow[]): ProjectResponse {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    contributors: contributors.map(toContributorSummary),
    repoUrl: row.repoUrl ?? null,
    coverUrl: row.coverUrl ?? null,
  };
}

export function createProjectsRouter(deps: ProjectsRouterDeps): ExpressRouter {
  const {
    projectRepo,
    requireAuth,
    requireAdmin = requireAdminDefault,
    cloudinary,
    cloudinaryProjectCoversFolder,
  } = deps;
  const router = Router();

  const coverUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: COVER_MAX_BYTES, files: 1 },
  });

  const multerCoverSingle: RequestHandler = (req, res, next) => {
    coverUpload.single("file")(req, res, (err) => {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(new HttpError(413, ErrorCode.FILE_TOO_LARGE, "File quá lớn (max 4 MB)"));
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

  const params = z.object({ slug: slugSchema });

  const getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = req.params as { slug: string };
      const project = await projectRepo.findBySlug(slug);
      if (!project || project.archivedAt !== null) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
        return;
      }
      const featureRows = await projectRepo.listFeatures(project.id);
      const featureIds = featureRows.map((f) => f.id);
      const [projectContributors, featureContributorsMap] = await Promise.all([
        projectRepo.getContributorsForProject(project.id),
        getContributorsForFeatures(projectRepo, featureIds),
      ]);
      const response: { project: ProjectResponse; features: FeatureListItem[] } = {
        project: toProjectResponse(project, projectContributors),
        features: featureRows.map((f) => ({
          id: f.id,
          slug: f.slug,
          title: f.title,
          filledCount: Number(f.filledCount),
          updatedAt: f.updatedAt.toISOString(),
          contributors: (featureContributorsMap.get(f.id) ?? []).map(toContributorSummary),
          prUrl: f.prUrl ?? null,
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
      // New project → no contributors yet (no sections edited).
      res.status(201).json({ data: toProjectResponse(project, []) });
    } catch (err) {
      if (err instanceof SlugConflictError) {
        next(new HttpError(409, ErrorCode.PROJECT_SLUG_TAKEN, "Slug đã được dùng, chọn slug khác"));
        return;
      }
      next(err);
    }
  };

  const patch: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = req.params as { slug: string };
      const body = req.body as UpdateProjectRequest;
      const updated = await projectRepo.updateMetadata(slug, {
        name: body.name,
        description: body.description ?? null,
        repoUrl: body.repoUrl,
      });
      if (!updated) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
        return;
      }
      const contributors = await projectRepo.getContributorsForProject(updated.id);
      res.status(200).json({ data: toProjectResponse(updated, contributors) });
    } catch (err) {
      next(err);
    }
  };

  const archive: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = req.params as { slug: string };
      const ok = await projectRepo.archive(slug);
      if (!ok) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  const list: RequestHandler = async (_req, res, next) => {
    try {
      const rows = await projectRepo.listNonArchived();
      const ids = rows.map((r) => r.id);
      const contributorsByProject = await projectRepo.getContributorsForProjects(ids);
      res.status(200).json({
        data: rows.map((r) => toProjectSummary(r, contributorsByProject.get(r.id) ?? [])),
      });
    } catch (err) {
      next(err);
    }
  };

  router.get("/", requireAuth, list);
  router.post(
    "/",
    requireAuth,
    requireAdmin,
    zodValidate({ body: createProjectRequestSchema }),
    create,
  );
  router.get("/:slug", requireAuth, zodValidate({ params }), getBySlug);
  router.patch(
    "/:slug",
    requireAuth,
    requireAdmin,
    zodValidate({ params, body: updateProjectRequestSchema }),
    patch,
  );
  router.post("/:slug/archive", requireAuth, requireAdmin, zodValidate({ params }), archive);

  const uploadProjectCover: RequestHandler = async (req, res, next) => {
    try {
      if (!cloudinary || !cloudinaryProjectCoversFolder) {
        next(
          new HttpError(
            503,
            ErrorCode.UPLOADS_DISABLED,
            "Upload tạm thời không khả dụng (Cloudinary chưa cấu hình)",
          ),
        );
        return;
      }

      const { slug } = req.params as { slug: string };
      const project = await projectRepo.findBySlug(slug);
      if (!project || project.archivedAt !== null) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
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
      const publicId = `${cloudinaryProjectCoversFolder}/${id}`;

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

      const updated = await projectRepo.updateCoverUrl(slug, cloudinaryResult.secureUrl);
      if (!updated) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
        return;
      }
      res.status(200).json({ data: { coverUrl: cloudinaryResult.secureUrl } });
    } catch (err) {
      next(err);
    }
  };

  const deleteProjectCover: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = req.params as { slug: string };
      const project = await projectRepo.findBySlug(slug);
      if (!project || project.archivedAt !== null) {
        next(new HttpError(404, ErrorCode.PROJECT_NOT_FOUND, "Project không tồn tại"));
        return;
      }
      if (project.coverUrl) {
        const publicId = publicIdFromUrl(project.coverUrl);
        if (publicId && cloudinary?.isConfigured()) {
          try {
            await cloudinary.destroyImage(publicId);
          } catch (err) {
            logger.warn(
              { event: "project_cover.destroy_failed", slug, publicId, err: String(err) },
              "Cloudinary destroy failed; proceeding with DB clear",
            );
          }
        }
        await projectRepo.updateCoverUrl(slug, null);
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  router.post(
    "/:slug/cover",
    requireAuth,
    requireAdmin,
    zodValidate({ params }),
    multerCoverSingle,
    uploadProjectCover,
  );
  router.delete(
    "/:slug/cover",
    requireAuth,
    requireAdmin,
    zodValidate({ params }),
    deleteProjectCover,
  );
  return router;
}
