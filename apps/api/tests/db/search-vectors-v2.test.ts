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

/**
 * US-006 T1 — unaccent + pg_trgm extensions, immutable_unaccent helper,
 * trigram GIN indexes for short fields (FR-SEARCH-004).
 */
describe("US-006 T1 — unaccent + pg_trgm + trigram indexes (FR-SEARCH-004)", () => {
  it("has unaccent + pg_trgm extensions enabled", async () => {
    const result = await db.execute<{ extname: string }>(sql`
      SELECT extname FROM pg_extension
      WHERE extname IN ('unaccent', 'pg_trgm')
      ORDER BY extname
    `);
    expect(result.rows.map((r) => r.extname)).toEqual(["pg_trgm", "unaccent"]);
  });

  it("exposes immutable_unaccent(text) marked IMMUTABLE", async () => {
    const result = await db.execute<{ provolatile: string }>(sql`
      SELECT provolatile FROM pg_proc WHERE proname = 'immutable_unaccent'
    `);
    expect(result.rows.length).toBeGreaterThan(0);
    // 'i' = IMMUTABLE, 's' = STABLE, 'v' = VOLATILE
    expect(result.rows[0]?.provolatile).toBe("i");
  });

  it("immutable_unaccent removes Vietnamese diacritics", async () => {
    const result = await db.execute<{ result: string }>(sql`
      SELECT immutable_unaccent('Đăng nhập SSO') AS result
    `);
    expect(result.rows[0]?.result).toBe("Dang nhap SSO");
  });

  it("projects.name has a trigram GIN index over immutable_unaccent", async () => {
    const result = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'projects'
        AND indexdef ILIKE '%gin_trgm_ops%'
        AND indexdef ILIKE '%immutable_unaccent%'
        AND indexdef ILIKE '%name%'
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("features.title has a trigram GIN index over immutable_unaccent", async () => {
    const result = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'features'
        AND indexdef ILIKE '%gin_trgm_ops%'
        AND indexdef ILIKE '%immutable_unaccent%'
        AND indexdef ILIKE '%title%'
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("users.display_name has a trigram GIN index over immutable_unaccent", async () => {
    const result = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'users'
        AND indexdef ILIKE '%gin_trgm_ops%'
        AND indexdef ILIKE '%immutable_unaccent%'
        AND indexdef ILIKE '%display_name%'
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("uploads.filename has a trigram GIN index over immutable_unaccent", async () => {
    const result = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'uploads'
        AND indexdef ILIKE '%gin_trgm_ops%'
        AND indexdef ILIKE '%immutable_unaccent%'
        AND indexdef ILIKE '%filename%'
    `);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("projects.search_vector contains unaccented lexemes after rebuild", async () => {
    // Use a throwaway project to verify the rebuild fn includes immutable_unaccent.
    const [demo] = await db.select().from(projects).where(eq(projects.slug, "demo")).limit(1);
    const createdBy = demo!.createdBy;
    const slug = `t1-unaccent-${Date.now()}`;

    const [tmp] = await db
      .insert(projects)
      .values({ slug, name: "Đăng nhập SSO", createdBy })
      .returning();

    try {
      // Query by unaccented term: "dang" should match "Đăng" once unaccented.
      const result = await db.execute<{ slug: string }>(sql`
        SELECT slug FROM projects
        WHERE search_vector @@ to_tsquery('simple', 'dang:*')
          AND id = ${tmp!.id}
      `);
      expect(result.rows.some((r) => r.slug === slug)).toBe(true);
    } finally {
      await db.delete(projects).where(eq(projects.id, tmp!.id));
    }
  });
});
