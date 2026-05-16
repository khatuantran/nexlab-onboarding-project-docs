import { describe, expect, it } from "vitest";
import { skillColorSchema, updateSkillsRequestSchema } from "../../src/schemas/skills.js";

describe("skillColorSchema (US-018)", () => {
  it("accepts each of 7 allowed hues", () => {
    for (const c of ["purple", "orange", "green", "blue", "rose", "amber", "primary"]) {
      expect(skillColorSchema.safeParse(c).success).toBe(true);
    }
  });
  it("rejects unknown color", () => {
    expect(skillColorSchema.safeParse("rainbow").success).toBe(false);
  });
});

describe("updateSkillsRequestSchema (US-018)", () => {
  it("accepts empty array (clears)", () => {
    expect(updateSkillsRequestSchema.safeParse({ skills: [] }).success).toBe(true);
  });

  it("accepts 12 items", () => {
    const skills = Array.from({ length: 12 }, (_, i) => ({
      label: `skill-${i}`,
      color: "blue" as const,
    }));
    expect(updateSkillsRequestSchema.safeParse({ skills }).success).toBe(true);
  });

  it("rejects 13 items with .max(12)", () => {
    const skills = Array.from({ length: 13 }, (_, i) => ({
      label: `skill-${i}`,
      color: "blue" as const,
    }));
    expect(updateSkillsRequestSchema.safeParse({ skills }).success).toBe(false);
  });

  it("rejects duplicate label (case-insensitive)", () => {
    const res = updateSkillsRequestSchema.safeParse({
      skills: [
        { label: "SQL", color: "blue" },
        { label: "sql", color: "purple" },
      ],
    });
    expect(res.success).toBe(false);
  });

  it("rejects empty label", () => {
    expect(
      updateSkillsRequestSchema.safeParse({ skills: [{ label: "", color: "blue" }] }).success,
    ).toBe(false);
  });

  it("rejects invalid color", () => {
    expect(
      updateSkillsRequestSchema.safeParse({
        skills: [{ label: "SQL", color: "rainbow" as never }],
      }).success,
    ).toBe(false);
  });
});
