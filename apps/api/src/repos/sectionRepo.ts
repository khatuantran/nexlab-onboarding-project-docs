import { and, eq, sql } from "drizzle-orm";
import type { SectionType } from "@onboarding/shared";
import type { Db } from "../db/client.js";
import { features, sections, type Section } from "../db/schema.js";

export interface UpdateSectionInput {
  featureId: string;
  type: SectionType;
  body: string;
  updatedBy: string;
}

export interface SectionRepo {
  findFeature(featureId: string): Promise<{ id: string } | null>;
  update(input: UpdateSectionInput): Promise<Section | null>;
}

export function createSectionRepo(db: Db): SectionRepo {
  return {
    async findFeature(featureId) {
      const rows = await db
        .select({ id: features.id })
        .from(features)
        .where(eq(features.id, featureId))
        .limit(1);
      return rows[0] ?? null;
    },
    async update(input) {
      return await db.transaction(async (tx) => {
        const [row] = await tx
          .update(sections)
          .set({
            body: input.body,
            updatedBy: input.updatedBy,
            updatedAt: new Date(),
          })
          .where(and(eq(sections.featureId, input.featureId), eq(sections.type, input.type)))
          .returning();
        if (!row) return null;

        // Bump parent feature.updated_at so landing-page sort reflects the
        // section edit (AC-6 US-002).
        await tx
          .update(features)
          .set({ updatedAt: sql`NOW()` })
          .where(eq(features.id, input.featureId));

        return row;
      });
    },
  };
}
