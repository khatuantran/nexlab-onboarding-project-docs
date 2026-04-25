import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "../../src/db/client.js";
import { features, projects, sections, users } from "../../src/db/schema.js";
import { pool } from "../../src/db.js";

/**
 * Integration tests — hit real Postgres via docker compose.
 * Assumes `pnpm docker:up` + `pnpm db:migrate` + `pnpm db:seed` đã chạy trước.
 * Tests KHÔNG reset DB (reuse dev data v1 per T5 plan).
 */

beforeAll(async () => {
  // Probe connection — fail fast nếu không có DB.
  await db.execute(sql`SELECT 1`);
});

afterAll(async () => {
  await pool.end();
});

describe("seed data", () => {
  it("has 2 users with expected roles (admin + author)", async () => {
    const rows = await db.select().from(users);

    const emails = rows.map((u) => u.email).sort();
    expect(emails).toEqual(["admin@local", "dev@local"]);

    const admin = rows.find((u) => u.email === "admin@local");
    const author = rows.find((u) => u.email === "dev@local");
    expect(admin?.role).toBe("admin");
    expect(author?.role).toBe("author");
  });

  it("stores bcrypt-hashed passwords (not plaintext)", async () => {
    const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
    expect(admin?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(admin?.passwordHash).not.toContain("dev12345");
  });

  it("seeds demo project with 1 feature and 5 sections in fixed order", async () => {
    const [project] = await db.select().from(projects).where(eq(projects.slug, "demo")).limit(1);
    expect(project?.name).toBe("Demo Project");

    const projectFeatures = await db
      .select()
      .from(features)
      .where(eq(features.projectId, project!.id));
    expect(projectFeatures).toHaveLength(1);
    expect(projectFeatures[0]?.slug).toBe("login-with-email");

    const featureSections = await db
      .select()
      .from(sections)
      .where(eq(sections.featureId, projectFeatures[0]!.id));
    expect(featureSections).toHaveLength(5);

    const types = featureSections.map((s) => s.type).sort();
    expect(types).toEqual(
      ["business", "business-rules", "screenshots", "tech-notes", "user-flow"].sort(),
    );
  });
});

describe("FTS trigger features_rebuild_search_vector", () => {
  it("populates features.search_vector after seed", async () => {
    const result = await db.execute<{ sv_text: string }>(sql`
      SELECT search_vector::text AS sv_text FROM features WHERE slug = 'login-with-email'
    `);
    const row = result.rows[0] as { sv_text: string } | undefined;
    expect(row?.sv_text).toBeTruthy();
    expect(row?.sv_text?.length ?? 0).toBeGreaterThan(0);
  });

  it("matches tsquery for a term present in title", async () => {
    const result = await db.execute<{ slug: string }>(sql`
      SELECT slug FROM features
      WHERE search_vector @@ plainto_tsquery('simple', 'đăng')
    `);
    expect(result.rows.length).toBeGreaterThan(0);
    // Pilot fixtures (Daikin KTV, etc.) also match 'đăng'; assert the demo
    // feature is in the result set rather than at position 0.
    expect(result.rows.some((r) => r.slug === "login-with-email")).toBe(true);
  });

  it("matches tsquery for a term present only in section body", async () => {
    const result = await db.execute<{ slug: string }>(sql`
      SELECT slug FROM features
      WHERE search_vector @@ plainto_tsquery('simple', 'bcrypt')
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });
});

describe("cascade delete", () => {
  it("removes sections when their feature is deleted", async () => {
    // Create a throwaway feature + sections, then delete the feature.
    const [project] = await db.select().from(projects).where(eq(projects.slug, "demo")).limit(1);
    const [feat] = await db
      .insert(features)
      .values({ projectId: project!.id, slug: "tmp-cascade-test", title: "Throwaway" })
      .returning();
    expect(feat).toBeDefined();

    await db.insert(sections).values({ featureId: feat!.id, type: "business", body: "tmp" });

    const sectionsBefore = await db.select().from(sections).where(eq(sections.featureId, feat!.id));
    expect(sectionsBefore.length).toBe(1);

    await db.delete(features).where(eq(features.id, feat!.id));

    const sectionsAfter = await db.select().from(sections).where(eq(sections.featureId, feat!.id));
    expect(sectionsAfter.length).toBe(0);
  });
});
