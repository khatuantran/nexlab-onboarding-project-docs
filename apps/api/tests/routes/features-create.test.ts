import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createProjectsRouter } from "../../src/routes/projects.js";
import { createFeaturesRouter } from "../../src/routes/features.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createFeatureRepo } from "../../src/repos/featureRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { requireAdmin } from "../../src/middleware/requireAdmin.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { projects, sections } from "../../src/db/schema.js";

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);
  const featureRepo = createFeatureRepo(db);

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
    projectsRouter: createProjectsRouter({ projectRepo, requireAuth }),
    featuresRouter: createFeaturesRouter({ featureRepo, projectRepo, requireAuth, requireAdmin }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const CREATED_PROJECT_SLUGS: string[] = [];
let testProjectSlug = "";

beforeAll(async () => {
  const admin = await loginAs("admin@local");
  testProjectSlug = `t3-host-${Date.now()}`;
  CREATED_PROJECT_SLUGS.push(testProjectSlug);
  const res = await admin
    .post("/api/v1/projects")
    .send({ slug: testProjectSlug, name: "T3 Host Project" });
  if (res.status !== 201) throw new Error(`host project setup failed: ${res.status}`);
});

afterAll(async () => {
  if (CREATED_PROJECT_SLUGS.length > 0) {
    await db.delete(projects).where(inArray(projects.slug, CREATED_PROJECT_SLUGS));
  }
  await pool.end();
});

describe("POST /api/v1/projects/:slug/features", () => {
  it("returns 201 + creates feature + 5 empty sections atomically", async () => {
    const agent = await loginAs("admin@local");
    const slug = `login-${Date.now()}`;

    const res = await agent
      .post(`/api/v1/projects/${testProjectSlug}/features`)
      .send({ slug, title: "Đăng nhập bằng email" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ slug, title: "Đăng nhập bằng email" });
    expect(res.body.data.id).toBeDefined();

    const sectionRows = await db
      .select()
      .from(sections)
      .where(eq(sections.featureId, res.body.data.id));
    expect(sectionRows).toHaveLength(5);
    expect(sectionRows.every((s) => s.body === "")).toBe(true);
    const types = sectionRows.map((s) => s.type).sort();
    expect(types).toEqual(
      ["business", "business-rules", "screenshots", "tech-notes", "user-flow"].sort(),
    );
  });

  it("returns 404 PROJECT_NOT_FOUND for unknown project slug", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/projects/nonexistent-${Date.now()}/features`)
      .send({ slug: "feat", title: "x" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("returns 409 FEATURE_SLUG_TAKEN within same project", async () => {
    const agent = await loginAs("admin@local");
    const slug = `dup-${Date.now()}`;

    const first = await agent
      .post(`/api/v1/projects/${testProjectSlug}/features`)
      .send({ slug, title: "First" });
    expect(first.status).toBe(201);

    const second = await agent
      .post(`/api/v1/projects/${testProjectSlug}/features`)
      .send({ slug, title: "Second" });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("FEATURE_SLUG_TAKEN");
  });

  it("allows same feature slug across different projects", async () => {
    const admin = await loginAs("admin@local");
    const otherProjectSlug = `t3-other-${Date.now()}`;
    CREATED_PROJECT_SLUGS.push(otherProjectSlug);
    await admin.post("/api/v1/projects").send({ slug: otherProjectSlug, name: "Other" });

    const sharedFeatureSlug = `shared-${Date.now()}`;
    const a = await admin
      .post(`/api/v1/projects/${testProjectSlug}/features`)
      .send({ slug: sharedFeatureSlug, title: "In first" });
    const b = await admin
      .post(`/api/v1/projects/${otherProjectSlug}/features`)
      .send({ slug: sharedFeatureSlug, title: "In other" });

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
  });

  it("returns 201 for author role (admin+author both allowed)", async () => {
    const agent = await loginAs("dev@local");
    const res = await agent
      .post(`/api/v1/projects/${testProjectSlug}/features`)
      .send({ slug: `author-${Date.now()}`, title: "From author" });

    expect(res.status).toBe(201);
  });

  it("returns 401 UNAUTHENTICATED when no session", async () => {
    const res = await request(buildApp())
      .post(`/api/v1/projects/${testProjectSlug}/features`)
      .send({ slug: "noauth", title: "x" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 400 VALIDATION_ERROR for empty title", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .post(`/api/v1/projects/${testProjectSlug}/features`)
      .send({ slug: `valid-${Date.now()}`, title: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
