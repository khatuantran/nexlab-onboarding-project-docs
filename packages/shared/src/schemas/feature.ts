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

export const searchQuerySchema = z.object({
  q: z.string().min(1, "q is required").max(200, "q quá dài"),
  projectSlug: slugSchema.optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export interface ProjectResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureListItem {
  id: string;
  slug: string;
  title: string;
  filledCount: number;
  updatedAt: string;
}

export interface SectionResponse {
  type: SectionType;
  body: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface FeatureResponse {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHit {
  projectSlug: string;
  featureSlug: string;
  title: string;
  snippet: string;
  rank: number;
}
