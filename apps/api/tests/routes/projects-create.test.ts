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

describe("POST /api/v1/projects", () => {
  it("returns 201 and created project for admin", async () => {
    const agent = await loginAs("admin@local");
    const slug = `t2-admin-${Date.now()}`;
    CREATED_SLUGS.push(slug);

    const res = await agent
      .post("/api/v1/projects")
      .send({ slug, name: "T2 Admin Project", description: "created in test" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      slug,
      name: "T2 Admin Project",
      description: "created in test",
    });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
  });

  it("returns 403 FORBIDDEN for author role", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent.post("/api/v1/projects").send({ slug: "t2-blocked", name: "Blocked" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 401 UNAUTHENTICATED when no session", async () => {
    const res = await request(buildApp())
      .post("/api/v1/projects")
      .send({ slug: "t2-noauth", name: "NoAuth" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 409 PROJECT_SLUG_TAKEN when slug exists", async () => {
    const agent = await loginAs("admin@local");
    const slug = `t2-dup-${Date.now()}`;
    CREATED_SLUGS.push(slug);

    const first = await agent.post("/api/v1/projects").send({ slug, name: "First" });
    expect(first.status).toBe(201);

    const second = await agent.post("/api/v1/projects").send({ slug, name: "Second" });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("PROJECT_SLUG_TAKEN");
  });

  it("returns 400 VALIDATION_ERROR for invalid slug", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.post("/api/v1/projects").send({ slug: "Invalid Slug!", name: "X" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("persists created_by = session user id", async () => {
    const agent = await loginAs("admin@local");
    const slug = `t2-createdby-${Date.now()}`;
    CREATED_SLUGS.push(slug);

    const meRes = await agent.get("/api/v1/auth/me");
    const userId = meRes.body.data.user.id;

    const res = await agent.post("/api/v1/projects").send({ slug, name: "CreatedBy Test" });
    expect(res.status).toBe(201);

    const rows = await db
      .select({ createdBy: projects.createdBy })
      .from(projects)
      .where(sql`${projects.slug} = ${slug}`);
    expect(rows[0]?.createdBy).toBe(userId);
  });
});
