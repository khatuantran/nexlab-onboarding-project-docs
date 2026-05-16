import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../src/db/client.js";
import { features, projects, sections, users } from "../../src/db/schema.js";
import { pool } from "../../src/db.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";

/**
 * US-011 — projectRepo contributors aggregation.
 *
 * Sets up a temp project with 2 features (1 archived) + 3 users
 * editing sections at distinct timestamps; asserts:
 *   AC-1 — sorted by most-recent edit per user
 *   AC-2 — top-5 cap (here we use 6 users to verify cap)
 *   AC-3 — empty when no edits
 *   AC-4 — archived features excluded from project scope
 *   AC-5 — feature scope is isolated from siblings
 */

const repo = createProjectRepo(db);

let projectId: string;
let featureArchivedId: string;
let projectEmptyId: string;
const activeFeatureIds: string[] = [];
const userIds: string[] = [];

const tempUserEmails: string[] = [];

async function makeUser(email: string, displayName: string): Promise<string> {
  tempUserEmails.push(email);
  const [u] = await db
    .insert(users)
    .values({
      email,
      passwordHash: "x".repeat(60),
      displayName,
      role: "author",
    })
    .returning({ id: users.id });
  return u!.id;
}

beforeAll(async () => {
  // Find seeded admin to be the creator FK.
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  const adminId = admin!.id;

  // Project with mixed feature archive states.
  const [p] = await db
    .insert(projects)
    .values({ slug: "us011-contribs", name: "US-011 Test", createdBy: adminId })
    .returning({ id: projects.id });
  projectId = p!.id;

  // Empty project (no features → no contributors).
  const [pe] = await db
    .insert(projects)
    .values({ slug: "us011-empty", name: "US-011 Empty", createdBy: adminId })
    .returning({ id: projects.id });
  projectEmptyId = pe!.id;

  // Archived feature.
  const [fArch] = await db
    .insert(features)
    .values({
      projectId,
      slug: "archived",
      title: "Archived",
      archivedAt: new Date(),
    })
    .returning({ id: features.id });
  featureArchivedId = fArch!.id;

  // Create 6 users to verify cap=5.
  for (let i = 1; i <= 6; i++) {
    const id = await makeUser(`us011-user-${i}@local`, `User ${i}`);
    userIds.push(id);
  }

  // 6 ACTIVE features, one per user, one section each. Avoids the
  // sections_feature_type_uidx constraint we'd hit if all 6 shared a feature.
  // u1 = oldest, u6 = newest by section updated_at.
  const base = new Date("2026-05-01T00:00:00Z").getTime();
  for (let i = 0; i < 6; i++) {
    const [f] = await db
      .insert(features)
      .values({ projectId, slug: `f${i}`, title: `Feature ${i}` })
      .returning({ id: features.id });
    activeFeatureIds.push(f!.id);
    await db.insert(sections).values({
      featureId: f!.id,
      type: "business",
      body: `body ${i}`,
      updatedBy: userIds[i],
      updatedAt: new Date(base + i * 60_000),
    });
  }

  // Insert 1 section on ARCHIVED feature, edited by a 7th user (should be excluded from project scope).
  const orphanId = await makeUser("us011-orphan@local", "Orphan");
  userIds.push(orphanId);
  await db.insert(sections).values({
    featureId: featureArchivedId,
    type: "business",
    body: "should not count",
    updatedBy: orphanId,
    updatedAt: new Date(base + 1000 * 60_000),
  });
});

afterAll(async () => {
  await db
    .delete(sections)
    .where(inArray(sections.featureId, [...activeFeatureIds, featureArchivedId]));
  await db.delete(features).where(inArray(features.id, [...activeFeatureIds, featureArchivedId]));
  await db.delete(projects).where(inArray(projects.id, [projectId, projectEmptyId]));
  await db.delete(users).where(inArray(users.email, tempUserEmails));
  await pool.end();
});

describe("projectRepo contributors (US-011)", () => {
  it("AC-1 + AC-2: top-5 sorted by recency desc, excludes 6th user (cap)", async () => {
    const rows = await repo.getContributorsForProject(projectId);
    expect(rows.length).toBe(5);
    // u6 most-recent → first; u2 should be last (u1 excluded by cap).
    expect(rows[0]!.displayName).toBe("User 6");
    expect(rows[4]!.displayName).toBe("User 2");
    // Orphan (archived feature) must NOT appear.
    expect(rows.some((r) => r.displayName === "Orphan")).toBe(false);
  });

  it("AC-3: empty project → empty array", async () => {
    const rows = await repo.getContributorsForProject(projectEmptyId);
    expect(rows).toEqual([]);
  });

  it("AC-4: archived features excluded from project scope", async () => {
    const rows = await repo.getContributorsForProject(projectId);
    expect(rows.some((r) => r.displayName === "Orphan")).toBe(false);
  });

  it("AC-5: feature scope is isolated — only that feature's editors", async () => {
    const rows = await repo.getContributorsForFeature(featureArchivedId);
    expect(rows.length).toBe(1);
    expect(rows[0]!.displayName).toBe("Orphan");

    // The most-recently-edited active feature (last in activeFeatureIds).
    const rowsActive = await repo.getContributorsForFeature(activeFeatureIds[5]!);
    expect(rowsActive.length).toBe(1);
    expect(rowsActive[0]!.displayName).toBe("User 6");
  });

  it("batched: getContributorsForProjects returns Map<projectId, contributors[]> capped at limit", async () => {
    const map = await repo.getContributorsForProjects([projectId, projectEmptyId]);
    expect(map.get(projectId)?.length).toBe(5);
    expect(map.get(projectEmptyId)).toBeUndefined();
  });
});
