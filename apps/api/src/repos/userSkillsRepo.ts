import { asc, eq } from "drizzle-orm";
import type { SkillColor, SkillItem } from "@onboarding/shared";
import type { Db } from "../db/client.js";
import { userSkills, type UserSkill } from "../db/schema.js";

/**
 * US-018 — per-user skills CRUD repo. Two operations: GET (ordered list) and
 * replace-all (delete + insert in single tx). Returns the post-replace state
 * so the route can send it back without a second SELECT.
 */
export interface UserSkillsRepo {
  getForUser(userId: string): Promise<SkillItem[]>;
  replaceAll(
    userId: string,
    skills: Array<Pick<SkillItem, "label" | "color">>,
  ): Promise<SkillItem[]>;
}

function toSkillItem(row: UserSkill): SkillItem {
  return {
    id: row.id,
    label: row.label,
    color: row.color as SkillColor,
    sortOrder: row.sortOrder,
  };
}

export function createUserSkillsRepo(db: Db): UserSkillsRepo {
  return {
    async getForUser(userId) {
      const rows = await db
        .select()
        .from(userSkills)
        .where(eq(userSkills.userId, userId))
        .orderBy(asc(userSkills.sortOrder));
      return rows.map(toSkillItem);
    },

    async replaceAll(userId, skills) {
      // Single transaction: wipe then insert in incoming order. `sort_order`
      // is derived from array index so callers don't need to send it.
      return await db.transaction(async (tx) => {
        await tx.delete(userSkills).where(eq(userSkills.userId, userId));
        if (skills.length === 0) return [];
        const inserted = await tx
          .insert(userSkills)
          .values(
            skills.map((s, i) => ({
              userId,
              label: s.label.trim(),
              color: s.color,
              sortOrder: i,
            })),
          )
          .returning();
        return inserted.map(toSkillItem);
      });
    },
  };
}
