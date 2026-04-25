import { z } from "zod";
import { sectionTypeSchema, type SectionType } from "./feature.js";

/**
 * US-005 / FR-SEARCH-002 + FR-SEARCH-003 — multi-entity grouped search.
 *
 * Response shape replaces the v1 flat `SearchHit[]` (still exported from
 * feature.ts as a deprecated alias until US-005 ships). Routes return
 * grouped results so that the UI can render Projects / Features /
 * Sections / Authors / Uploads sections independently.
 */

export const featureStatusSchema = z.enum(["filled", "partial", "empty"]);
export type FeatureStatus = z.infer<typeof featureStatusSchema>;

export const searchOptsSchema = z.object({
  projectSlug: z.string().optional(),
  sectionTypes: z.array(sectionTypeSchema).optional(),
  authorId: z.string().uuid().optional(),
  updatedSince: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  status: featureStatusSchema.optional(),
});
export type SearchOpts = z.infer<typeof searchOptsSchema>;

export interface ProjectHit {
  slug: string;
  name: string;
  snippet: string;
  featureCount: number;
  updatedAt: string;
  rank: number;
}

export interface FeatureHit {
  projectSlug: string;
  featureSlug: string;
  title: string;
  snippet: string;
  rank: number;
  updatedAt: string;
  filledSectionCount: number;
}

export interface SectionHit {
  projectSlug: string;
  featureSlug: string;
  featureTitle: string;
  sectionType: SectionType;
  snippet: string;
  updatedByName: string | null;
  updatedAt: string;
  rank: number;
}

export interface AuthorHit {
  id: string;
  displayName: string;
  role: "admin" | "author";
  touchedFeatureCount: number;
  rank: number;
}

export interface UploadHit {
  id: string;
  filename: string;
  caption: string | null;
  projectSlug: string;
  featureSlug: string;
  featureTitle: string;
  uploadedByName: string | null;
  createdAt: string;
  rank: number;
}

export interface SearchResultsV2 {
  projects: ProjectHit[];
  features: FeatureHit[];
  sections: SectionHit[];
  authors: AuthorHit[];
  uploads: UploadHit[];
}

export const HITS_PER_GROUP = 5;
