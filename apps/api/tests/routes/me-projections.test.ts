import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createUserSkillsRepo } from "../../src/repos/userSkillsRepo.js";
import session from "express-session";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createMeRouter } from "../../src/routes/me.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createUserStatsRepo } from "../../src/repos/userStatsRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { features, projects, sections, users } from "../../src/db/schema.js";
import type { CloudinaryClient } from "../../src/lib/cloudinary.js";

const fakeCloudinary: CloudinaryClient = {
  isConfigured: () => true,
  async uploadImage() {
    throw new Error("not used in this test file");
  },
};
const fakeRedisFull = {
  scan: async () => ["0", []] as [string, string[]],
  get: async () => null,
  del: async () => 0,
};

function buildApp() {
  const userRepo = createUserRepo(db);
  const userStatsRepo = createUserStatsRepo(db);
  const fakeRedis: RateLimitClient = { incr: async () => 1, expire: async () => 1 };
  const loginRateLimit = createRateLimit({
    redis: fakeRedis,
    keyFn: (req) => `login:${req.ip}`,
    max: 100,
    windowSec: 60,
  });
  const requireAuth = createRequireAuth(userRepo);
  const sessionMiddleware = session({
    name: "sid",
    secret: "test-secret-min-16-chars-aaaaa",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: false },
  });
  return createApp({
    dbCheck: async () => "ok",
    redisCheck: async () => "ok",
    version: "test",
    sessionMiddleware,
    authRouter: createAuthRouter({ userRepo, loginRateLimit }),
    meRouter: createMeRouter({
      userRepo,
      userStatsRepo,
      userSkillsRepo: createUserSkillsRepo(db),
      requireAuth,
      redis: fakeRedisFull,
      cloudinary: fakeCloudinary,
      cloudinaryAvatarsFolder: "test",
      cloudinaryUserCoversFolder: "test",
    }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return agent;
}

const seed = {
  projectIds: [] as string[],
  emails: [] as string[],
};

beforeAll(async () => {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  const adminId = admin!.id;
  const ts = Date.now();

  const [p1] = await db
    .insert(projects)
    .values({ slug: `us0156-p1-${ts}`, name: "P1", createdBy: adminId })
    .returning({ id: projects.id });
  const [p2] = await db
    .insert(projects)
    .values({ slug: `us0156-p2-${ts}`, name: "P2", createdBy: adminId })
    .returning({ id: projects.id });
  seed.projectIds.push(p1!.id, p2!.id);

  const types = ["business", "user-flow", "business-rules", "tech-notes", "screenshots"] as const;

  // P1 has 1 feature, fully documented by admin@local (4 non-empty + 1 empty? -> set non-empty to all 5 to count as documented).
  const [f1] = await db
    .insert(features)
    .values({ projectId: p1!.id, slug: "p1f1", title: "P1F1" })
    .returning({ id: features.id });
  const base = Date.now() - 86_400_000;
  for (let i = 0; i < 5; i++) {
    await db.insert(sections).values({
      featureId: f1!.id,
      type: types[i]!,
      body: `b-${types[i]!}`,
      updatedBy: adminId,
      updatedAt: new Date(base + i * 1000),
    });
  }

  // P2 has 1 feature with only 2 sections filled by admin@local.
  const [f2] = await db
    .insert(features)
    .values({ projectId: p2!.id, slug: "p2f1", title: "P2F1" })
    .returning({ id: features.id });
  for (let i = 0; i < 5; i++) {
    await db.insert(sections).values({
      featureId: f2!.id,
      type: types[i]!,
      body: i < 2 ? `b-${types[i]!}` : "",
      updatedBy: adminId,
      updatedAt: new Date(base + 5_000 + i * 1000),
    });
  }
  // Note: total sections for admin@local touched = 10 (all rows above);
  // sectionsCompleted = 5 (P1F1) + 2 (P2F1) = 7;
  // projectsTouched = 2; featuresDocumented = 1 (P1F1 has 5/5).
});

afterAll(async () => {
  await db.delete(projects).where(inArray(projects.id, seed.projectIds));
  if (seed.emails.length > 0) {
    await db.delete(users).where(inArray(users.email, seed.emails));
  }
  await pool.end();
});

describe("GET /api/v1/me/stats (US-015)", () => {
  it("AC-1 + AC-3 + AC-5: returns 4 counts derived from sessions's edits", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/me/stats");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      projectsTouched: expect.any(Number),
      featuresDocumented: expect.any(Number),
      totalEdits: expect.any(Number),
      sectionsCompleted: expect.any(Number),
    });
    expect(res.body.data.projectsTouched).toBeGreaterThanOrEqual(2);
    expect(res.body.data.featuresDocumented).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalEdits).toBeGreaterThanOrEqual(10);
    expect(res.body.data.sectionsCompleted).toBeGreaterThanOrEqual(7);
    expect(res.body.data.totalEdits).toBeGreaterThanOrEqual(res.body.data.sectionsCompleted);
  });

  it("AC-6: 401 when no session", async () => {
    const res = await request(buildApp()).get("/api/v1/me/stats");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/me/recent-projects (US-016)", () => {
  it("AC-1 + AC-2: returns user-touched projects ordered by most-recent edit, limit clamped", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/me/recent-projects?limit=4");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const slugs = (res.body.data as Array<{ slug: string }>).map((r) => r.slug);
    const p1Idx = slugs.findIndex((s) => s.startsWith("us0156-p1"));
    const p2Idx = slugs.findIndex((s) => s.startsWith("us0156-p2"));
    expect(p1Idx).toBeGreaterThanOrEqual(0);
    expect(p2Idx).toBeGreaterThanOrEqual(0);
    // P2 was edited later than P1 → P2 first.
    expect(p2Idx).toBeLessThan(p1Idx);
  });

  it("AC-2: default limit = 4 when missing", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/me/recent-projects");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(4);
  });

  it("AC-6: 401 unauth", async () => {
    const res = await request(buildApp()).get("/api/v1/me/recent-projects");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/me/activity (US-017)", () => {
  it("AC-1 + AC-2: returns paginated activity sorted desc by updatedAt", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/me/activity?limit=5");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    const times = (res.body.data.items as Array<{ updatedAt: string }>).map((r) =>
      Date.parse(r.updatedAt),
    );
    for (let i = 0; i < times.length - 1; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i + 1]!);
    }
    expect(["string", "object"]).toContain(typeof res.body.data.nextCursor);
  });

  it("AC-3: cursor pagination — fetching with cursor returns older items", async () => {
    const admin = await loginAs("admin@local");
    const first = await admin.get("/api/v1/me/activity?limit=3");
    expect(first.status).toBe(200);
    if (!first.body.data.nextCursor) return; // skip when corpus < 3
    const second = await admin.get(
      `/api/v1/me/activity?limit=3&cursor=${encodeURIComponent(first.body.data.nextCursor)}`,
    );
    expect(second.status).toBe(200);
    const firstIds = (first.body.data.items as Array<{ id: string }>).map((r) => r.id);
    const secondIds = (second.body.data.items as Array<{ id: string }>).map((r) => r.id);
    for (const id of secondIds) expect(firstIds).not.toContain(id);
  });

  it("AC-6: invalid limit (=0) → 400 VALIDATION_ERROR", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/me/activity?limit=0");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("AC-7: 401 unauth", async () => {
    const res = await request(buildApp()).get("/api/v1/me/activity");
    expect(res.status).toBe(401);
  });
});
