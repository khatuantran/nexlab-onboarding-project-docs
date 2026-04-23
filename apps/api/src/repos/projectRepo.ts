import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { features, projects, sections, type Project } from "../db/schema.js";

export interface FeatureListRow {
  id: string;
  slug: string;
  title: string;
  updatedAt: Date;
  filledCount: number;
}

export interface ProjectRepo {
  findBySlug(slug: string): Promise<Project | null>;
  listFeatures(projectId: string): Promise<FeatureListRow[]>;
}

export function createProjectRepo(db: Db): ProjectRepo {
  return {
    async findBySlug(slug) {
      const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
      return rows[0] ?? null;
    },
    async listFeatures(projectId) {
      // Feature list + count of sections with non-empty body (filledCount).
      // Single query via LEFT JOIN + FILTER to avoid N+1.
      const rows = await db
        .select({
          id: features.id,
          slug: features.slug,
          title: features.title,
          updatedAt: features.updatedAt,
          filledCount: sql<number>`COUNT(${sections.id}) FILTER (WHERE length(${sections.body}) > 0)::int`,
        })
        .from(features)
        .leftJoin(sections, eq(sections.featureId, features.id))
        .where(eq(features.projectId, projectId))
        .groupBy(features.id)
        .orderBy(desc(features.updatedAt));
      return rows;
    },
  };
}

export { and };
