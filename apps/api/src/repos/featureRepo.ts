import { and, eq, isNull } from "drizzle-orm";
import { SECTION_ORDER } from "@onboarding/shared";
import type { Db } from "../db/client.js";
import { features, projects, sections, users, type Feature, type Section } from "../db/schema.js";

export type SectionWithAuthor = Section & { updatedByName: string | null };

export interface CreateFeatureInput {
  projectId: string;
  slug: string;
  title: string;
}

export class FeatureSlugConflictError extends Error {
  constructor() {
    super("feature slug conflict");
    this.name = "FeatureSlugConflictError";
  }
}

export interface FeatureRepo {
  findByProjectAndSlug(
    projectSlug: string,
    featureSlug: string,
  ): Promise<{ feature: Feature; sections: SectionWithAuthor[] } | null>;
  findById(id: string): Promise<Feature | null>;
  create(input: CreateFeatureInput): Promise<Feature>;
  /**
   * US-008: soft-delete a feature by setting `archived_at = NOW()`.
   * Idempotent — calling on an already-archived row still resolves true
   * (mirror `projectRepo.archive` semantics). Returns false if the
   * (projectSlug, featureSlug) pair doesn't match any row.
   */
  archive(projectSlug: string, featureSlug: string): Promise<boolean>;
}

export function createFeatureRepo(db: Db): FeatureRepo {
  return {
    async findByProjectAndSlug(projectSlug, featureSlug) {
      const rows = await db
        .select({ feature: features })
        .from(features)
        .innerJoin(projects, eq(projects.id, features.projectId))
        .where(
          and(
            eq(projects.slug, projectSlug),
            eq(features.slug, featureSlug),
            // US-008: archived features hidden from direct GET → 404.
            isNull(features.archivedAt),
          ),
        )
        .limit(1);
      const row = rows[0];
      if (!row) return null;

      const sectionRows = await db
        .select({
          id: sections.id,
          featureId: sections.featureId,
          type: sections.type,
          body: sections.body,
          updatedBy: sections.updatedBy,
          updatedAt: sections.updatedAt,
          updatedByName: users.displayName,
        })
        .from(sections)
        .leftJoin(users, eq(users.id, sections.updatedBy))
        .where(eq(sections.featureId, row.feature.id));
      return { feature: row.feature, sections: sectionRows };
    },
    async findById(id) {
      const rows = await db.select().from(features).where(eq(features.id, id)).limit(1);
      return rows[0] ?? null;
    },
    async create(input) {
      try {
        return await db.transaction(async (tx) => {
          const [feature] = await tx
            .insert(features)
            .values({
              projectId: input.projectId,
              slug: input.slug,
              title: input.title,
            })
            .returning();
          if (!feature) throw new Error("feature insert returned no row");

          await tx.insert(sections).values(
            SECTION_ORDER.map((type) => ({
              featureId: feature.id,
              type,
              body: "",
            })),
          );
          return feature;
        });
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "23505"
        ) {
          throw new FeatureSlugConflictError();
        }
        throw err;
      }
    },
    async archive(projectSlug, featureSlug) {
      // Resolve project id via subquery so a single statement covers both
      // the slug pair join + the soft-delete update. No archived-filter
      // here on purpose — idempotent second call must still return true.
      const projectIdSub = db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, projectSlug));
      const rows = await db
        .update(features)
        .set({ archivedAt: new Date() })
        .where(and(eq(features.slug, featureSlug), eq(features.projectId, projectIdSub)))
        .returning({ id: features.id });
      return rows.length > 0;
    },
  };
}
