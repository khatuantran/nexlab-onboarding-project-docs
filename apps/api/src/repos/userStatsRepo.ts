import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import type {
  ActivityItem,
  ActivityPage,
  MeStats,
  RecentProjectItem,
  SectionType,
} from "@onboarding/shared";
import type { Db } from "../db/client.js";
import { features, projects, sections } from "../db/schema.js";

/**
 * US-015 / US-016 / US-017 — per-user projections derived from
 * `sections.updated_by = userId`. All queries exclude archived
 * features + archived projects. No history table v1 (PUT overwrites
 * `updated_by/_at`), so counts reflect current row state only.
 */
export interface UserStatsRepo {
  getStatsForUser(userId: string): Promise<MeStats>;
  getRecentProjectsForUser(userId: string, limit: number): Promise<RecentProjectItem[]>;
  getActivityForUser(
    userId: string,
    opts: { limit: number; cursor: Date | null },
  ): Promise<ActivityPage>;
}

export function createUserStatsRepo(db: Db): UserStatsRepo {
  return {
    async getStatsForUser(userId) {
      // projectsTouched + sectionsCompleted + totalEdits derived from a single
      // scan; featuresDocumented requires a HAVING subquery so we run that
      // separately. All keyed off `sections.updated_by = userId`.
      const [agg] = await db
        .select({
          projectsTouched: sql<number>`COUNT(DISTINCT ${features.projectId})::int`,
          totalEdits: sql<number>`COUNT(${sections.id})::int`,
          sectionsCompleted: sql<number>`COUNT(${sections.id}) FILTER (WHERE length(${sections.body}) > 0)::int`,
        })
        .from(sections)
        .innerJoin(features, eq(features.id, sections.featureId))
        .innerJoin(projects, eq(projects.id, features.projectId))
        .where(
          and(
            eq(sections.updatedBy, userId),
            isNull(features.archivedAt),
            isNull(projects.archivedAt),
          ),
        );

      // featuresDocumented: features the caller touched that have all 5 sections non-empty
      // (any author). The HAVING is on the feature scope, joined back to the caller.
      const docResult = await db.execute(sql`
        SELECT COUNT(*)::int AS count FROM (
          SELECT f.id
          FROM ${features} f
          INNER JOIN ${projects} p ON p.id = f.project_id AND p.archived_at IS NULL
          INNER JOIN ${sections} s ON s.feature_id = f.id
          WHERE f.archived_at IS NULL
            AND EXISTS (
              SELECT 1 FROM ${sections} s2
              WHERE s2.feature_id = f.id AND s2.updated_by = ${userId}
            )
          GROUP BY f.id
          HAVING COUNT(*) FILTER (WHERE length(s.body) > 0) = 5
        ) docs
      `);
      const featuresDocumented = Number(
        (docResult.rows[0] as { count?: number | string } | undefined)?.count ?? 0,
      );

      return {
        projectsTouched: Number(agg?.projectsTouched ?? 0),
        featuresDocumented,
        totalEdits: Number(agg?.totalEdits ?? 0),
        sectionsCompleted: Number(agg?.sectionsCompleted ?? 0),
      };
    },

    async getRecentProjectsForUser(userId, limit) {
      const rows = await db
        .select({
          slug: projects.slug,
          name: projects.name,
          lastTouchedAt: sql<Date>`MAX(${sections.updatedAt})`,
          sectionsTouched: sql<number>`COUNT(${sections.id})::int`,
        })
        .from(sections)
        .innerJoin(features, eq(features.id, sections.featureId))
        .innerJoin(projects, eq(projects.id, features.projectId))
        .where(
          and(
            eq(sections.updatedBy, userId),
            isNull(features.archivedAt),
            isNull(projects.archivedAt),
          ),
        )
        .groupBy(projects.slug, projects.name)
        .orderBy(sql`MAX(${sections.updatedAt}) DESC`)
        .limit(limit);
      return rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        lastTouchedAt:
          r.lastTouchedAt instanceof Date
            ? r.lastTouchedAt.toISOString()
            : new Date(r.lastTouchedAt as unknown as string).toISOString(),
        sectionsTouched: Number(r.sectionsTouched),
      }));
    },

    async getActivityForUser(userId, { limit, cursor }) {
      const baseWhere = and(
        eq(sections.updatedBy, userId),
        isNull(features.archivedAt),
        isNull(projects.archivedAt),
        cursor ? lt(sections.updatedAt, cursor) : undefined,
      );
      const rows = await db
        .select({
          id: sections.id,
          sectionType: sections.type,
          updatedAt: sections.updatedAt,
          featureSlug: features.slug,
          featureTitle: features.title,
          projectSlug: projects.slug,
          projectName: projects.name,
        })
        .from(sections)
        .innerJoin(features, eq(features.id, sections.featureId))
        .innerJoin(projects, eq(projects.id, features.projectId))
        .where(baseWhere)
        .orderBy(desc(sections.updatedAt))
        .limit(limit + 1);

      let nextCursor: string | null = null;
      const slice = rows.length > limit ? rows.slice(0, limit) : rows;
      if (rows.length > limit) {
        const last = slice[slice.length - 1]!;
        nextCursor =
          last.updatedAt instanceof Date
            ? last.updatedAt.toISOString()
            : new Date(last.updatedAt as unknown as string).toISOString();
      }

      const items: ActivityItem[] = slice.map((r) => ({
        id: r.id,
        sectionType: r.sectionType as SectionType,
        featureSlug: r.featureSlug,
        featureTitle: r.featureTitle,
        projectSlug: r.projectSlug,
        projectName: r.projectName,
        updatedAt:
          r.updatedAt instanceof Date
            ? r.updatedAt.toISOString()
            : new Date(r.updatedAt as unknown as string).toISOString(),
        verbCode: "updated",
      }));

      return { items, nextCursor };
    },
  };
}
