import { and, eq } from "drizzle-orm";
import { SECTION_ORDER } from "@onboarding/shared";
import type { Db } from "../db/client.js";
import { features, projects, sections, type Feature, type Section } from "../db/schema.js";

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
  ): Promise<{ feature: Feature; sections: Section[] } | null>;
  findById(id: string): Promise<Feature | null>;
  create(input: CreateFeatureInput): Promise<Feature>;
}

export function createFeatureRepo(db: Db): FeatureRepo {
  return {
    async findByProjectAndSlug(projectSlug, featureSlug) {
      const rows = await db
        .select({ feature: features })
        .from(features)
        .innerJoin(projects, eq(projects.id, features.projectId))
        .where(and(eq(projects.slug, projectSlug), eq(features.slug, featureSlug)))
        .limit(1);
      const row = rows[0];
      if (!row) return null;

      const sectionRows = await db
        .select()
        .from(sections)
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
  };
}
