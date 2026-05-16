import { z } from "zod";
import { slugSchema, urlSchema, type ContributorSummary } from "./feature.js";

export const createProjectRequestSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, "Tên project bắt buộc").max(120, "Tên project tối đa 120 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
});

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

/**
 * Admin edit payload. Slug intentionally omitted — immutable post-create
 * per FR-PROJ-002. Zod strips unknown keys by default so `{slug}` trong
 * body bị drop silent; server cũng định hướng ignore explicit.
 */
export const updateProjectRequestSchema = z.object({
  name: z.string().min(1, "Tên project bắt buộc").max(120, "Tên project tối đa 120 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
  /** US-013 — external Git repo URL; null clears, missing leaves untouched. */
  repoUrl: urlSchema.nullable().optional(),
});

export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;

/**
 * Catalog list response shape (US-004 T2). Flatter than ProjectResponse
 * — includes derived `featureCount` + no sensitive fields like
 * `createdBy`.
 */
export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  featureCount: number;
  updatedAt: string;
  createdAt: string;
  /** US-011 — top 5 contributors by recency, empty when no edits. */
  contributors: ContributorSummary[];
  /** US-013 — external Git repo URL, null when not set. */
  repoUrl: string | null;
  /** US-014 — sum of non-empty sections across this project's non-archived features. */
  filledSectionCount: number;
  /** US-019 — Cloudinary secure_url cho cover image. null = gradient fallback. */
  coverUrl: string | null;
}
