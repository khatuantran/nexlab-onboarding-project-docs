import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { inArray, sql } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createProjectsRouter } from "../../src/routes/projects.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { projects } from "../../src/db/schema.js";

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);

  const fakeRedis: RateLimitClient = {
    incr: async () => 1,
    expire: async () => 1,
  };
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
    projectsRouter: createProjectsRouter({ projectRepo, requireAuth }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const CREATED_SLUGS: string[] = [];

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterEach(async () => {
  if (CREATED_SLUGS.length === 0) return;
  await db.delete(projects).where(inArray(projects.slug, CREATED_SLUGS));
  CREATED_SLUGS.length = 0;
});

afterAll(async () => {
  await pool.end();
});

describe("GET /api/v1/projects", () => {
  it("returns 200 with ProjectSummary array including seeded demo project", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.get("/api/v1/projects");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const demo = res.body.data.find((p: { slug: string }) => p.slug === "demo");
    expect(demo).toBeDefined();
    expect(demo).toMatchObject({
      id: expect.any(String),
      slug: "demo",
      name: expect.any(String),
      featureCount: expect.any(Number),
      updatedAt: expect.any(String),
      createdAt: expect.any(String),
    });
    expect(demo.featureCount).toBeGreaterThanOrEqual(1);
  });

  it("returns rows sorted by updated_at desc", async () => {
    const agent = await loginAs("admin@local");

    const slugA = `t2-list-a-${Date.now()}`;
    const slugB = `t2-list-b-${Date.now()}`;
    CREATED_SLUGS.push(slugA, slugB);

    await agent.post("/api/v1/projects").send({ slug: slugA, name: "A" });
    await new Promise((r) => setTimeout(r, 10));
    await agent.post("/api/v1/projects").send({ slug: slugB, name: "B" });

    const res = await agent.get("/api/v1/projects");
    expect(res.status).toBe(200);

    const slugs = res.body.data.map((p: { slug: string }) => p.slug);
    const idxA = slugs.indexOf(slugA);
    const idxB = slugs.indexOf(slugB);
    expect(idxB).toBeLessThan(idxA); // B created later → appears first
  });

  it("excludes archived projects", async () => {
    const agent = await loginAs("admin@local");
    const slug = `t2-archived-${Date.now()}`;
    CREATED_SLUGS.push(slug);

    const create = await agent.post("/api/v1/projects").send({ slug, name: "To Archive" });
    expect(create.status).toBe(201);

    // Archive directly via SQL (T3 will add endpoint later).
    await db.execute(sql`UPDATE projects SET archived_at = NOW() WHERE slug = ${slug}`);

    const res = await agent.get("/api/v1/projects");
    expect(res.status).toBe(200);
    const slugs = res.body.data.map((p: { slug: string }) => p.slug);
    expect(slugs).not.toContain(slug);
  });

  it("returns 401 UNAUTHENTICATED without session", async () => {
    const res = await request(buildApp()).get("/api/v1/projects");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
