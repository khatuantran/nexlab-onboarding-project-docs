import { z } from "zod";

/**
 * Fixed render order for the 5-section template (FR-FEAT-002).
 * BE returns sections in this order; FE renders headers in this order.
 * Changing this requires a migration + FE coordination.
 */
export const SECTION_ORDER = [
  "business",
  "user-flow",
  "business-rules",
  "tech-notes",
  "screenshots",
] as const;

export type SectionType = (typeof SECTION_ORDER)[number];

export const sectionTypeSchema = z.enum(SECTION_ORDER);

/**
 * US-013 — generic http(s) URL accepted for external link fields (repo / PR).
 * Loose validation per user triage 2026-05-16: any `http(s)` domain, max 500 chars.
 * Domain whitelist + GitHub API enrichment defer to v2.
 */
export const urlSchema = z
  .string()
  .max(500, "URL tối đa 500 ký tự")
  .regex(/^https?:\/\/.+/u, "URL phải bắt đầu với http:// hoặc https://");

/**
 * Slug format (projects + features). Lowercase kebab-case, 3-60 chars.
 * Matches `api-surface.md §Response shape conventions`.
 */
export const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/u, "Slug không hợp lệ");

export const createFeatureRequestSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, "Tiêu đề bắt buộc").max(160, "Tiêu đề tối đa 160 ký tự"),
});

export type CreateFeatureRequest = z.infer<typeof createFeatureRequestSchema>;

/**
 * US-012 — admin edit feature metadata (title + slug). Both fields optional
 * but ≥ 1 must be present; empty body rejected. Slug collisions surface as
 * 409 `FEATURE_SLUG_TAKEN` (server-side enforced).
 */
export const updateFeatureRequestSchema = z
  .object({
    title: z.string().min(1, "Tiêu đề bắt buộc").max(160, "Tiêu đề tối đa 160 ký tự").optional(),
    slug: slugSchema.optional(),
    /** US-013 — PR URL; null clears, missing leaves untouched. */
    prUrl: urlSchema.nullable().optional(),
  })
  .refine((v) => v.title !== undefined || v.slug !== undefined || v.prUrl !== undefined, {
    message: "Cần ít nhất 1 trường",
  });

export type UpdateFeatureRequest = z.infer<typeof updateFeatureRequestSchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1, "q is required").max(200, "q quá dài"),
  projectSlug: slugSchema.optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * US-011 — derived per-scope contributor summary (max 5 per response).
 * Derived from DISTINCT `sections.updated_by` within the scope,
 * sorted by most-recent edit. No schema change; pure projection.
 */
export interface ContributorSummary {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastUpdatedAt: string;
}

export interface ProjectResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  /** US-011 — top 5 contributors by recency, empty when no edits. */
  contributors: ContributorSummary[];
  /** US-013 — external Git repo URL, null when not set. */
  repoUrl: string | null;
  /** US-019 — Cloudinary secure_url cho cover image. null = gradient fallback. */
  coverUrl: string | null;
}

export interface FeatureListItem {
  id: string;
  slug: string;
  title: string;
  filledCount: number;
  updatedAt: string;
  /** US-011 — top 5 contributors by recency, empty when no edits. */
  contributors: ContributorSummary[];
  /** US-013 — external Pull Request URL, null when not set. */
  prUrl: string | null;
}

export interface SectionResponse {
  type: SectionType;
  body: string;
  updatedAt: string;
  updatedBy: string | null;
  updatedByName: string | null;
}

export interface FeatureResponse {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** US-011 — top 5 contributors by recency, empty when no edits. */
  contributors: ContributorSummary[];
  /** US-013 — external Pull Request URL, null when not set. */
  prUrl: string | null;
}

export interface SearchHit {
  projectSlug: string;
  featureSlug: string;
  title: string;
  snippet: string;
  rank: number;
}
