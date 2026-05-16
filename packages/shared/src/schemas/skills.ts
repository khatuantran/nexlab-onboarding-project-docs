import { z } from "zod";

/**
 * US-018 — colored chip palette for `user_skills.color`. Restricted to the 7
 * v4 design-system accent hues; FE dropdown + BE Zod boundary share this enum.
 */
export const SKILL_COLORS = [
  "purple",
  "orange",
  "green",
  "blue",
  "rose",
  "amber",
  "primary",
] as const;
export type SkillColor = (typeof SKILL_COLORS)[number];
export const skillColorSchema = z.enum(SKILL_COLORS);

export interface SkillItem {
  id?: string;
  label: string;
  color: SkillColor;
  sortOrder: number;
}

/**
 * Replace-all body for `PUT /api/v1/me/skills`. The array can be empty (clears
 * the caller's skills). Cap 12 enforced server-side via `.max(12)` → 400. Inner
 * label dedupe is case-insensitive (matches the DB unique index).
 */
export const updateSkillsRequestSchema = z
  .object({
    skills: z
      .array(
        z.object({
          label: z
            .string()
            .min(1, "Tên skill không được trống")
            .max(40, "Tên skill tối đa 40 ký tự"),
          color: skillColorSchema,
          sortOrder: z.number().int().nonnegative().optional(),
        }),
      )
      .max(12, "Tối đa 12 skill"),
  })
  .refine(
    (v) => {
      const seen = new Set<string>();
      for (const s of v.skills) {
        const k = s.label.trim().toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
      }
      return true;
    },
    { message: "Skill bị trùng (không phân biệt hoa thường)", path: ["skills"] },
  );

export type UpdateSkillsRequest = z.infer<typeof updateSkillsRequestSchema>;
