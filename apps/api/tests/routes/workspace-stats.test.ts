import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createWorkspaceRouter } from "../../src/routes/workspace.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { features, projects, sections, users } from "../../src/db/schema.js";

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);
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
    workspaceRouter: createWorkspaceRouter({ projectRepo, requireAuth }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return agent;
}

const projectIds: string[] = [];
const tempUserEmails: string[] = [];

beforeAll(async () => {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  const adminId = admin!.id;

  const [active] = await db
    .insert(projects)
    .values({ slug: `us014-active-${Date.now()}`, name: "Active", createdBy: adminId })
    .returning({ id: projects.id });
  const [archivedProj] = await db
    .insert(projects)
    .values({
      slug: `us014-arch-${Date.now()}`,
      name: "Archived",
      createdBy: adminId,
      archivedAt: new Date(),
    })
    .returning({ id: projects.id });
  projectIds.push(active!.id, archivedProj!.id);

  const u1Email = `us014-u1-${Date.now()}@local`;
  const u2Email = `us014-u2-${Date.now() + 1}@local`;
  tempUserEmails.push(u1Email, u2Email);
  const [u1] = await db
    .insert(users)
    .values({
      email: u1Email,
      passwordHash: "x".repeat(60),
      displayName: "U1",
      role: "author",
    })
    .returning({ id: users.id });
  const [u2] = await db
    .insert(users)
    .values({
      email: u2Email,
      passwordHash: "x".repeat(60),
      displayName: "U2",
      role: "author",
    })
    .returning({ id: users.id });

  // Feature 1: fully documented (all 5 non-empty), edited by U1 5d ago.
  const [f1] = await db
    .insert(features)
    .values({ projectId: active!.id, slug: "fully", title: "Fully" })
    .returning({ id: features.id });
  const types = ["business", "user-flow", "business-rules", "tech-notes", "screenshots"] as const;
  const recent = new Date(Date.now() - 5 * 86_400_000);
  for (const t of types) {
    await db.insert(sections).values({
      featureId: f1!.id,
      type: t,
      body: `body-${t}`,
      updatedBy: u1!.id,
      updatedAt: recent,
    });
  }

  // Feature 2: 4 of 5 filled (not "documented"), edited by U2 60 days ago (outside window).
  const [f2] = await db
    .insert(features)
    .values({ projectId: active!.id, slug: "partial", title: "Partial" })
    .returning({ id: features.id });
  const stale = new Date(Date.now() - 60 * 86_400_000);
  for (let i = 0; i < types.length; i++) {
    await db.insert(sections).values({
      featureId: f2!.id,
      type: types[i]!,
      body: i < 4 ? `body-${types[i]!}` : "",
      updatedBy: u2!.id,
      updatedAt: stale,
    });
  }
});

afterAll(async () => {
  await db.delete(projects).where(inArray(projects.id, projectIds));
  await db.delete(users).where(inArray(users.email, tempUserEmails));
  await pool.end();
});

describe("GET /api/v1/workspace/stats (US-014)", () => {
  it("AC-1 + AC-2 + AC-3 + AC-4: returns 3-key shape with correct counts", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.get("/api/v1/workspace/stats");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      projectCount: expect.any(Number),
      featuresDocumented: expect.any(Number),
      contributorsActive: expect.any(Number),
    });
    // Active project ≥ 1; archived NOT counted.
    expect(res.body.data.projectCount).toBeGreaterThanOrEqual(1);
    // f1 fully docs counted; f2 (partial) NOT.
    expect(res.body.data.featuresDocumented).toBeGreaterThanOrEqual(1);
    // U1 (5d) inside window; U2 (60d) outside.
    expect(res.body.data.contributorsActive).toBeGreaterThanOrEqual(1);
  });

  it("AC-5: returns 401 UNAUTHENTICATED when no session", async () => {
    const res = await request(buildApp()).get("/api/v1/workspace/stats");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
