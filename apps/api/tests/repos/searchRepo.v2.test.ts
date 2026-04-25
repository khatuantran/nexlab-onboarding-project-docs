import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../src/db/client.js";
import { features, projects, sections, uploads, users } from "../../src/db/schema.js";
import { pool } from "../../src/db.js";
import { createSearchRepo } from "../../src/repos/searchRepo.js";

/**
 * Integration tests for US-005 T2 — searchAll multi-entity grouped search.
 * Reuses the docker compose Postgres + the seed (Demo project, 2 users, 1 feature).
 * Inserts a fixture upload + temporary archived project for filter assertions and
 * cleans them up afterwards.
 */

const repo = createSearchRepo(db);

let adminId: string;
let demoFeatureId: string;
let uploadId: string;

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);

  const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  adminId = admin!.id;

  const [demoFeature] = await db
    .select()
    .from(features)
    .where(eq(features.slug, "login-with-email"))
    .limit(1);
  demoFeatureId = demoFeature!.id;

  // Make sure the user-flow section has searchable body so the section group lights up.
  await db
    .update(sections)
    .set({
      body: "Người dùng mở app, nhấn Đăng nhập, nhập email và mật khẩu.",
      updatedBy: adminId,
    })
    .where(and(eq(sections.featureId, demoFeatureId), eq(sections.type, "user-flow")));

  // Fixture upload tagged to admin so author + upload filters resolve.
  const [tmp] = await db
    .insert(uploads)
    .values({
      featureId: demoFeatureId,
      uploadedBy: adminId,
      mimeType: "image/png",
      sizeBytes: 2048,
      filename: "search-v2-fixture.png",
      caption: "Sơ đồ luồng đăng nhập OTP cho Demo",
    })
    .returning();
  uploadId = tmp!.id;
});

afterAll(async () => {
  if (uploadId) {
    await db.delete(uploads).where(eq(uploads.id, uploadId));
  }
  await pool.end();
});

describe("searchAll — happy path", () => {
  it("returns five group keys even when some are empty", async () => {
    const result = await repo.searchAll("absolutely-no-match-zzzz");
    expect(Object.keys(result).sort()).toEqual([
      "authors",
      "features",
      "projects",
      "sections",
      "uploads",
    ]);
    for (const list of Object.values(result)) {
      expect(Array.isArray(list)).toBe(true);
    }
  });

  it("matches Demo project by description term + returns featureCount", async () => {
    const result = await repo.searchAll("onboard");
    const demo = result.projects.find((p) => p.slug === "demo");
    expect(demo).toBeDefined();
    expect(demo?.snippet).toContain("<mark>");
    expect(demo!.featureCount).toBeGreaterThanOrEqual(1);
  });

  it("returns feature hit with filledSectionCount + updatedAt", async () => {
    const result = await repo.searchAll("đăng nhập");
    const feature = result.features.find((f) => f.featureSlug === "login-with-email");
    expect(feature).toBeDefined();
    expect(feature?.filledSectionCount).toBeGreaterThanOrEqual(1);
    expect(typeof feature?.updatedAt).toBe("string");
  });

  it("returns section hit with sectionType + deep-link fields", async () => {
    const result = await repo.searchAll("nhập");
    const section = result.sections.find(
      (s) => s.featureSlug === "login-with-email" && s.sectionType === "user-flow",
    );
    expect(section).toBeDefined();
    expect(section?.snippet).toContain("<mark>");
    expect(section?.projectSlug).toBe("demo");
  });

  it("returns author hit with touchedFeatureCount", async () => {
    const result = await repo.searchAll("admin");
    const admin = result.authors.find((a) => a.displayName === "Admin");
    expect(admin).toBeDefined();
    expect(admin?.role).toBe("admin");
    expect(admin?.touchedFeatureCount).toBeGreaterThanOrEqual(1);
  });

  it("returns upload hit with parent feature breadcrumb", async () => {
    const result = await repo.searchAll("OTP");
    const upload = result.uploads.find((u) => u.id === uploadId);
    expect(upload).toBeDefined();
    expect(upload?.projectSlug).toBe("demo");
    expect(upload?.featureSlug).toBe("login-with-email");
    expect(upload?.uploadedByName).toBe("Admin");
  });
});

describe("searchAll — filters", () => {
  it("sectionTypes narrows sections to that type only", async () => {
    const result = await repo.searchAll("nhập", { sectionTypes: ["user-flow"] });
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sections.every((s) => s.sectionType === "user-flow")).toBe(true);
  });

  it("authorId narrows uploads to uploads by that author", async () => {
    const result = await repo.searchAll("OTP", { authorId: adminId });
    expect(result.uploads.every((u) => u.uploadedByName === "Admin")).toBe(true);
  });

  it("projectSlug scopes every entity to that project", async () => {
    const result = await repo.searchAll("đăng nhập", { projectSlug: "demo" });
    expect(result.features.every((f) => f.projectSlug === "demo")).toBe(true);
    expect(result.sections.every((s) => s.projectSlug === "demo")).toBe(true);
    expect(result.uploads.every((u) => u.projectSlug === "demo")).toBe(true);
  });

  it("updatedSince in the future filters out everything dated before it", async () => {
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const result = await repo.searchAll("đăng nhập", { updatedSince: future });
    expect(result.projects).toHaveLength(0);
    expect(result.features).toHaveLength(0);
    expect(result.sections).toHaveLength(0);
    expect(result.uploads).toHaveLength(0);
  });

  it("status=empty matches features with no filled sections", async () => {
    // Insert a temp feature with all empty sections (auto-init from feature creation flow
    // would normally do this, but here we just insert a feature row + 5 empty sections).
    const slug = `t2-empty-${Date.now()}`;
    const [demo] = await db.select().from(projects).where(eq(projects.slug, "demo")).limit(1);
    const [feat] = await db
      .insert(features)
      .values({ projectId: demo!.id, slug, title: "Empty bcrypt feature" })
      .returning();
    try {
      // Create 5 empty sections so the trigger picks up the search vector for title.
      await db.insert(sections).values([
        { featureId: feat!.id, type: "business", body: "" },
        { featureId: feat!.id, type: "user-flow", body: "" },
        { featureId: feat!.id, type: "business-rules", body: "" },
        { featureId: feat!.id, type: "tech-notes", body: "" },
        { featureId: feat!.id, type: "screenshots", body: "" },
      ]);

      const result = await repo.searchAll("bcrypt", { status: "empty" });
      const hit = result.features.find((f) => f.featureSlug === slug);
      expect(hit).toBeDefined();
      expect(hit?.filledSectionCount).toBe(0);
    } finally {
      await db.delete(features).where(eq(features.id, feat!.id));
    }
  });

  it("excludes archived projects from every group", async () => {
    const slug = `t2-archived-${Date.now()}`;
    const [demo] = await db.select().from(projects).where(eq(projects.slug, "demo")).limit(1);

    const [archivedProject] = await db
      .insert(projects)
      .values({
        slug,
        name: "ZZArchived bcrypt project",
        description: "ZZArchived project for searchAll test",
        createdBy: demo!.createdBy,
        archivedAt: new Date(),
      })
      .returning();

    const [feat] = await db
      .insert(features)
      .values({
        projectId: archivedProject!.id,
        slug: "archived-feature",
        title: "ZZArchived bcrypt feature",
      })
      .returning();

    try {
      const result = await repo.searchAll("ZZArchived");
      expect(result.projects.find((p) => p.slug === slug)).toBeUndefined();
      expect(result.features.find((f) => f.featureSlug === "archived-feature")).toBeUndefined();
    } finally {
      await db.delete(features).where(eq(features.id, feat!.id));
      await db.delete(projects).where(eq(projects.id, archivedProject!.id));
    }
  });
});
