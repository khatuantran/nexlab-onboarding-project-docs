import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { features, projects, sections, users, type Project } from "../db/schema.js";

export interface FeatureListRow {
  id: string;
  slug: string;
  title: string;
  updatedAt: Date;
  filledCount: number;
  prUrl: string | null;
}

export interface ProjectSummaryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  featureCount: number;
  createdAt: Date;
  updatedAt: Date;
  repoUrl: string | null;
  filledSectionCount: number;
  /** US-019 — Cloudinary cover URL or null. */
  coverUrl: string | null;
}

/**
 * US-014 — workspace-level aggregate stats. Computed on demand from
 * `projects` + `features` + `sections.updated_*`. No caching v1.
 */
export interface WorkspaceStatsRow {
  projectCount: number;
  featuresDocumented: number;
  contributorsActive: number;
}

export interface CreateProjectInput {
  slug: string;
  name: string;
  description?: string | null;
  createdBy: string;
}

export class SlugConflictError extends Error {
  constructor() {
    super("slug conflict");
    this.name = "SlugConflictError";
  }
}

export interface UpdateProjectMetadataInput {
  name: string;
  description?: string | null;
  /**
   * US-013 — external Git repo URL.
   * `undefined` = leave column untouched; `null` = clear; string = update.
   */
  repoUrl?: string | null;
}

/**
 * US-011 — derived per-scope top contributors. Sorted by most-recent
 * `sections.updated_at` desc per user. Returns at most `limit` entries.
 */
export interface ContributorRow {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastUpdatedAt: Date;
}

export interface ProjectRepo {
  findBySlug(slug: string): Promise<Project | null>;
  listFeatures(projectId: string): Promise<FeatureListRow[]>;
  listNonArchived(): Promise<ProjectSummaryRow[]>;
  create(input: CreateProjectInput): Promise<Project>;
  updateMetadata(slug: string, input: UpdateProjectMetadataInput): Promise<Project | null>;
  archive(slug: string): Promise<boolean>;
  /** US-019 — update only the cover_url column. Returns null when slug missing. */
  updateCoverUrl(slug: string, coverUrl: string | null): Promise<Project | null>;
  /** US-011 — top contributors for a single project (archived features excluded). */
  getContributorsForProject(projectId: string, limit?: number): Promise<ContributorRow[]>;
  /** US-011 — top contributors for a single feature. */
  getContributorsForFeature(featureId: string, limit?: number): Promise<ContributorRow[]>;
  /** US-011 — batched lookup for project list (avoids N+1). Returns Map<projectId, ContributorRow[]>. */
  getContributorsForProjects(
    projectIds: string[],
    limit?: number,
  ): Promise<Map<string, ContributorRow[]>>;
  /** US-014 — workspace stats endpoint backing query. */
  getWorkspaceStats(activeWindowDays?: number): Promise<WorkspaceStatsRow>;
}

export function createProjectRepo(db: Db): ProjectRepo {
  return {
    async findBySlug(slug) {
      const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
      return rows[0] ?? null;
    },
    async listNonArchived() {
      // US-014: join sections (LEFT) on top of features to compute
      // `filledSectionCount`. The features×sections inflation forces
      // COUNT(DISTINCT) for `featureCount`. Archived features are filtered
      // via the join predicate so they don't bleed into either column.
      const rows = await db
        .select({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          description: projects.description,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          repoUrl: projects.repoUrl,
          coverUrl: projects.coverUrl,
          featureCount: sql<number>`COUNT(DISTINCT ${features.id})::int`,
          filledSectionCount: sql<number>`COUNT(${sections.id}) FILTER (WHERE length(${sections.body}) > 0)::int`,
        })
        .from(projects)
        .leftJoin(features, and(eq(features.projectId, projects.id), isNull(features.archivedAt)))
        .leftJoin(sections, eq(sections.featureId, features.id))
        .where(isNull(projects.archivedAt))
        .groupBy(projects.id)
        .orderBy(desc(projects.updatedAt));
      return rows;
    },
    async getWorkspaceStats(activeWindowDays = 30) {
      const [projectsRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(projects)
        .where(isNull(projects.archivedAt));

      // featuresDocumented = features where every one of the 5 sections has body length > 0.
      // Equivalent: features with COUNT(sections where length(body) > 0) = 5.
      const featuresDocResult = await db.execute(sql`
        SELECT COUNT(*)::int AS count FROM (
          SELECT f.id
          FROM ${features} f
          INNER JOIN ${projects} p ON p.id = f.project_id AND p.archived_at IS NULL
          INNER JOIN ${sections} s ON s.feature_id = f.id
          WHERE f.archived_at IS NULL
          GROUP BY f.id
          HAVING COUNT(*) FILTER (WHERE length(s.body) > 0) = 5
        ) AS docs
      `);
      const featuresDocumented = Number(
        (featuresDocResult.rows[0] as { count?: number | string } | undefined)?.count ?? 0,
      );

      const [contribsRow] = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${sections.updatedBy})::int`,
        })
        .from(sections)
        .innerJoin(features, eq(features.id, sections.featureId))
        .innerJoin(projects, eq(projects.id, features.projectId))
        .where(
          and(
            isNull(features.archivedAt),
            isNull(projects.archivedAt),
            sql`${sections.updatedAt} >= NOW() - (${activeWindowDays} || ' days')::interval`,
          ),
        );

      return {
        projectCount: Number(projectsRow?.count ?? 0),
        featuresDocumented,
        contributorsActive: Number(contribsRow?.count ?? 0),
      };
    },
    async create(input) {
      try {
        const rows = await db
          .insert(projects)
          .values({
            slug: input.slug,
            name: input.name,
            description: input.description ?? null,
            createdBy: input.createdBy,
          })
          .returning();
        return rows[0]!;
      } catch (err) {
        // Postgres unique_violation (23505) → surface as domain error
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "23505"
        ) {
          throw new SlugConflictError();
        }
        throw err;
      }
    },
    async updateMetadata(slug, input) {
      const setClause: Partial<{
        name: string;
        description: string | null;
        repoUrl: string | null;
        updatedAt: Date;
      }> = {
        name: input.name,
        description: input.description ?? null,
        updatedAt: new Date(),
      };
      // Only touch repo_url when caller explicitly passed it (undefined skips).
      if (input.repoUrl !== undefined) setClause.repoUrl = input.repoUrl;
      const rows = await db
        .update(projects)
        .set(setClause)
        .where(and(eq(projects.slug, slug), isNull(projects.archivedAt)))
        .returning();
      return rows[0] ?? null;
    },
    async archive(slug) {
      const rows = await db
        .update(projects)
        .set({ archivedAt: new Date() })
        .where(eq(projects.slug, slug))
        .returning({ id: projects.id });
      return rows.length > 0;
    },
    async updateCoverUrl(slug, coverUrl) {
      const rows = await db
        .update(projects)
        .set({ coverUrl, updatedAt: new Date() })
        .where(and(eq(projects.slug, slug), isNull(projects.archivedAt)))
        .returning();
      return rows[0] ?? null;
    },
    async listFeatures(projectId) {
      // Feature list + count of sections with non-empty body (filledCount).
      // Single query via LEFT JOIN + FILTER to avoid N+1. US-008: filter
      // archived features so soft-deleted rows disappear from the catalog
      // without losing their sections + uploads.
      const rows = await db
        .select({
          id: features.id,
          slug: features.slug,
          title: features.title,
          updatedAt: features.updatedAt,
          prUrl: features.prUrl,
          filledCount: sql<number>`COUNT(${sections.id}) FILTER (WHERE length(${sections.body}) > 0)::int`,
        })
        .from(features)
        .leftJoin(sections, eq(sections.featureId, features.id))
        .where(and(eq(features.projectId, projectId), isNull(features.archivedAt)))
        .groupBy(features.id)
        .orderBy(desc(features.updatedAt));
      return rows;
    },
    async getContributorsForProject(projectId, limit = 5) {
      // DISTINCT ON (s.updated_by) keeps only most-recent edit per user.
      // Inner subquery groups by user → outer sorts by recency + limits.
      // Filter archived features so soft-deleted scope doesn't leak credit.
      const rows = await db
        .select({
          userId: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          lastUpdatedAt: sql<Date>`max(${sections.updatedAt})`,
        })
        .from(sections)
        .innerJoin(features, eq(sections.featureId, features.id))
        .innerJoin(users, eq(sections.updatedBy, users.id))
        .where(and(eq(features.projectId, projectId), isNull(features.archivedAt)))
        .groupBy(users.id, users.displayName, users.avatarUrl)
        .orderBy(sql`max(${sections.updatedAt}) DESC`)
        .limit(limit);
      return rows.map((r) => ({
        ...r,
        lastUpdatedAt:
          r.lastUpdatedAt instanceof Date ? r.lastUpdatedAt : new Date(r.lastUpdatedAt as string),
      }));
    },
    async getContributorsForFeature(featureId, limit = 5) {
      const rows = await db
        .select({
          userId: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          lastUpdatedAt: sql<Date>`max(${sections.updatedAt})`,
        })
        .from(sections)
        .innerJoin(users, eq(sections.updatedBy, users.id))
        .where(eq(sections.featureId, featureId))
        .groupBy(users.id, users.displayName, users.avatarUrl)
        .orderBy(sql`max(${sections.updatedAt}) DESC`)
        .limit(limit);
      return rows.map((r) => ({
        ...r,
        lastUpdatedAt:
          r.lastUpdatedAt instanceof Date ? r.lastUpdatedAt : new Date(r.lastUpdatedAt as string),
      }));
    },
    async getContributorsForProjects(projectIds, limit = 5) {
      const map = new Map<string, ContributorRow[]>();
      if (projectIds.length === 0) return map;
      // Single window-function query: rank per project by last edit,
      // keep top `limit`. Joins archived-filter via features table.
      const rows = await db.execute<{
        project_id: string;
        user_id: string;
        display_name: string;
        avatar_url: string | null;
        last_updated_at: Date;
      }>(sql`
        WITH per_user AS (
          SELECT
            f.project_id AS project_id,
            s.updated_by AS user_id,
            MAX(s.updated_at) AS last_updated_at
          FROM ${sections} s
          INNER JOIN ${features} f ON s.feature_id = f.id
          WHERE f.project_id IN (${sql.join(
            projectIds.map((id) => sql`${id}`),
            sql`, `,
          )})
            AND f.archived_at IS NULL
            AND s.updated_by IS NOT NULL
          GROUP BY f.project_id, s.updated_by
        ),
        ranked AS (
          SELECT
            project_id, user_id, last_updated_at,
            ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY last_updated_at DESC) AS rn
          FROM per_user
        )
        SELECT r.project_id, r.user_id, u.display_name, u.avatar_url, r.last_updated_at
        FROM ranked r
        INNER JOIN ${users} u ON r.user_id = u.id
        WHERE r.rn <= ${limit}
        ORDER BY r.project_id, r.last_updated_at DESC
      `);
      for (const r of rows.rows) {
        const list = map.get(r.project_id) ?? [];
        // pg returns timestamptz as a JS Date when typeParser is registered
        // (default for pg.Pool), but raw SQL execute may return string.
        // Normalize to Date.
        const ts =
          r.last_updated_at instanceof Date ? r.last_updated_at : new Date(r.last_updated_at);
        list.push({
          userId: r.user_id,
          displayName: r.display_name,
          avatarUrl: r.avatar_url,
          lastUpdatedAt: ts,
        });
        map.set(r.project_id, list);
      }
      return map;
    },
  };
}

export { and };
