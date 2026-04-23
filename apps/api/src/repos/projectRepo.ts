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

export interface ProjectRepo {
  findBySlug(slug: string): Promise<Project | null>;
  listFeatures(projectId: string): Promise<FeatureListRow[]>;
  create(input: CreateProjectInput): Promise<Project>;
}

export function createProjectRepo(db: Db): ProjectRepo {
  return {
    async findBySlug(slug) {
      const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
      return rows[0] ?? null;
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
