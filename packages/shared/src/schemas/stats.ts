import { z } from "zod";
import type { SectionType } from "./feature.js";

/**
 * US-014 — workspace aggregate stats (FR-STATS-001).
 * Derived on-demand from `projects` + `features` + `sections.updated_by/_at`.
 */
export interface WorkspaceStats {
  projectCount: number;
  featuresDocumented: number;
  contributorsActive: number;
}

/**
 * US-015 — per-user contribution counts (FR-PROFILE-001).
 * All counts source from rows where `sections.updated_by = sessionUserId`,
 * excluding archived features + archived projects.
 */
export interface MeStats {
  projectsTouched: number;
  featuresDocumented: number;
  totalEdits: number;
  sectionsCompleted: number;
}

/**
 * US-016 — single row of `/me/recent-projects` (FR-PROFILE-001).
 */
export interface RecentProjectItem {
  slug: string;
  name: string;
  lastTouchedAt: string;
  sectionsTouched: number;
}

export const recentProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(4),
});
export type RecentProjectsQuery = z.infer<typeof recentProjectsQuerySchema>;

/**
 * US-017 — single entry in `/me/activity` cursor feed (FR-ACTIVITY-001).
 * `verbCode` is fixed `'updated'` v1 since sections are the only event source.
 */
export interface ActivityItem {
  id: string;
  sectionType: SectionType;
  featureSlug: string;
  featureTitle: string;
  projectSlug: string;
  projectName: string;
  updatedAt: string;
  verbCode: "updated";
}

export interface ActivityPage {
  items: ActivityItem[];
  nextCursor: string | null;
}

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
});
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
