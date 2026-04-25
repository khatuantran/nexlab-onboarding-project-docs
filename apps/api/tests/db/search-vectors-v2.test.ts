import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "../../src/db/client.js";
import { features, projects, uploads } from "../../src/db/schema.js";
import { pool } from "../../src/db.js";

/**
 * Integration tests for US-005 T1 — tsvector + GIN indexes for projects + uploads.
 * Assumes `pnpm docker:up` + `pnpm db:migrate` + `pnpm db:seed` ran first.
 */

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterAll(async () => {
  await pool.end();
});

describe("projects.search_vector (FR-SEARCH-002)", () => {
  it("populates projects.search_vector for the demo project", async () => {
    const result = await db.execute<{ sv_text: string }>(sql`
      SELECT search_vector::text AS sv_text FROM projects WHERE slug = 'demo'
    `);
    const row = result.rows[0];
    expect(row?.sv_text).toBeTruthy();
    expect((row?.sv_text ?? "").length).toBeGreaterThan(0);
  });

  it("matches tsquery for term in project name", async () => {
    const result = await db.execute<{ slug: string }>(sql`
      SELECT slug FROM projects
      WHERE search_vector @@ plainto_tsquery('simple', 'demo')
    `);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]?.slug).toBe("demo");
  });

  it("matches tsquery for term in project description", async () => {
    const result = await db.execute<{ slug: string }>(sql`
      SELECT slug FROM projects
      WHERE search_vector @@ plainto_tsquery('simple', 'onboard')
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("rebuilds search_vector when project name updates", async () => {
    // Use a throwaway project so we don't mutate seed state across runs.
    const [adminUser] = await db.select().from(projects).where(eq(projects.slug, "demo")).limit(1);
    const createdBy = adminUser!.createdBy;
    const slug = `t1-rebuild-${Date.now()}`;

    const [tmp] = await db
      .insert(projects)
      .values({ slug, name: "Initial name", createdBy })
      .returning();

    try {
      await db.update(projects).set({ name: "Pilot SSO Đăng nhập" }).where(eq(projects.slug, slug));

      const result = await db.execute<{ slug: string }>(sql`
        SELECT slug FROM projects
        WHERE search_vector @@ plainto_tsquery('simple', 'sso')
      `);
      expect(result.rows.some((r) => r.slug === slug)).toBe(true);
    } finally {
      await db.delete(projects).where(eq(projects.id, tmp!.id));
    }
  });
});

describe("uploads.caption + uploads.search_vector (FR-SEARCH-002)", () => {
  it("uploads table exposes a nullable caption column", async () => {
    const result = await db.execute<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(sql`
      SELECT column_name, data_type, is_nullable FROM information_schema.columns
      WHERE table_name = 'uploads' AND column_name = 'caption'
    `);
    expect(result.rows[0]).toMatchObject({
      column_name: "caption",
      data_type: "text",
      is_nullable: "YES",
    });
  });

  it("populates uploads.search_vector from filename + caption", async () => {
    const [demoFeature] = await db
      .select()
      .from(features)
      .where(eq(features.slug, "login-with-email"))
      .limit(1);

    const [tmp] = await db
      .insert(uploads)
      .values({
        featureId: demoFeature!.id,
        mimeType: "image/png",
        sizeBytes: 1024,
        filename: "login-flow.png",
        caption: "Sơ đồ luồng đăng nhập OTP",
      })
      .returning();

    try {
      // Postgres 'simple' parser keeps hyphenated compounds + extensions as one
      // token. Match against the full filename to keep this test focused on the
      // trigger / index plumbing rather than tokenization rules.
      const matchByFilename = await db.execute<{ id: string }>(sql`
        SELECT id::text FROM uploads
        WHERE search_vector @@ plainto_tsquery('simple', 'login-flow.png')
      `);
      expect(matchByFilename.rows.some((r) => r.id === tmp!.id)).toBe(true);

      const matchByCaption = await db.execute<{ id: string }>(sql`
        SELECT id::text FROM uploads
        WHERE search_vector @@ plainto_tsquery('simple', 'OTP')
      `);
      expect(matchByCaption.rows.some((r) => r.id === tmp!.id)).toBe(true);
    } finally {
      await db.delete(uploads).where(eq(uploads.id, tmp!.id));
    }
  });
});

describe("GIN indexes", () => {
  it("projects has a GIN index on search_vector", async () => {
    const result = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'projects' AND indexdef ILIKE '%USING gin%search_vector%'
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("uploads has a GIN index on search_vector", async () => {
    const result = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'uploads' AND indexdef ILIKE '%USING gin%search_vector%'
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });
});
