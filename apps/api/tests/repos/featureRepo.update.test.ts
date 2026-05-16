import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../src/db/client.js";
import { features, projects, users } from "../../src/db/schema.js";
import { pool } from "../../src/db.js";
import { FeatureSlugConflictError, createFeatureRepo } from "../../src/repos/featureRepo.js";

/**
 * US-012 — featureRepo.update covers PATCH semantics:
 *   AC-1: title-only update
 *   AC-2: slug-only update
 *   AC-3: both atomically
 *   AC-5: slug conflict → throw FeatureSlugConflictError
 *   404-ish: non-existent / archived → null
 */

const repo = createFeatureRepo(db);

let projectId: string;
const featureIds: string[] = [];

beforeAll(async () => {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  const adminId = admin!.id;

  const [p] = await db
    .insert(projects)
    .values({ slug: "us012-test", name: "US-012 Test", createdBy: adminId })
    .returning({ id: projects.id });
  projectId = p!.id;

  const [f1] = await db
    .insert(features)
    .values({ projectId, slug: "alpha", title: "Alpha" })
    .returning({ id: features.id });
  featureIds.push(f1!.id);

  const [f2] = await db
    .insert(features)
    .values({ projectId, slug: "beta", title: "Beta" })
    .returning({ id: features.id });
  featureIds.push(f2!.id);

  const [f3] = await db
    .insert(features)
    .values({ projectId, slug: "gone", title: "Gone", archivedAt: new Date() })
    .returning({ id: features.id });
  featureIds.push(f3!.id);
});

afterAll(async () => {
  await db.delete(features).where(inArray(features.id, featureIds));
  await db.delete(projects).where(eq(projects.id, projectId));
  await pool.end();
});

describe("featureRepo.update (US-012)", () => {
  it("AC-1: updates title only, leaves slug + bumps updated_at", async () => {
    const before = await db
      .select({ slug: features.slug, updatedAt: features.updatedAt })
      .from(features)
      .where(eq(features.id, featureIds[0]!))
      .limit(1);
    await new Promise((r) => setTimeout(r, 5));
    const row = await repo.update("us012-test", "alpha", { title: "Alpha v2" });
    expect(row).not.toBeNull();
    expect(row!.title).toBe("Alpha v2");
    expect(row!.slug).toBe("alpha");
    expect(row!.updatedAt.getTime()).toBeGreaterThan(before[0]!.updatedAt.getTime());
  });

  it("AC-2: updates slug only", async () => {
    const row = await repo.update("us012-test", "alpha", { slug: "alpha-renamed" });
    expect(row).not.toBeNull();
    expect(row!.slug).toBe("alpha-renamed");
    expect(row!.title).toBe("Alpha v2");
  });

  it("AC-3: updates both fields atomically", async () => {
    const row = await repo.update("us012-test", "alpha-renamed", {
      title: "Final title",
      slug: "alpha-final",
    });
    expect(row).not.toBeNull();
    expect(row!.title).toBe("Final title");
    expect(row!.slug).toBe("alpha-final");
  });

  it("AC-5: slug collision throws FeatureSlugConflictError", async () => {
    await expect(repo.update("us012-test", "beta", { slug: "alpha-final" })).rejects.toBeInstanceOf(
      FeatureSlugConflictError,
    );
  });

  it("404: non-existent slug returns null", async () => {
    const row = await repo.update("us012-test", "ma-khong-co", { title: "x" });
    expect(row).toBeNull();
  });

  it("404: archived feature returns null (not editable)", async () => {
    const row = await repo.update("us012-test", "gone", { title: "x" });
    expect(row).toBeNull();
  });
});
