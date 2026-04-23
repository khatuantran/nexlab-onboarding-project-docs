import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { features, projects, sections, type Feature, type Section } from "../db/schema.js";

export interface FeatureRepo {
  findByProjectAndSlug(
    projectSlug: string,
    featureSlug: string,
  ): Promise<{ feature: Feature; sections: Section[] } | null>;
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
  };
}
