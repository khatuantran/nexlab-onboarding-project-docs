import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { inArray } from "drizzle-orm";
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
import { projects } from "../../src/db/schema.js";

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
let projectSlug = "";

beforeAll(async () => {
  const admin = await loginAs("admin@local");
  projectSlug = `us008-${Date.now()}`;
  CREATED_PROJECT_SLUGS.push(projectSlug);
  const res = await admin
    .post("/api/v1/projects")
    .send({ slug: projectSlug, name: "US-008 Host Project" });
  if (res.status !== 201) throw new Error(`project setup failed: ${res.status}`);
});

afterAll(async () => {
  if (CREATED_PROJECT_SLUGS.length > 0) {
    await db.delete(projects).where(inArray(projects.slug, CREATED_PROJECT_SLUGS));
  }
  await pool.end();
});

async function createFeature(slug: string): Promise<void> {
  const admin = await loginAs("admin@local");
  const res = await admin
    .post(`/api/v1/projects/${projectSlug}/features`)
    .send({ slug, title: slug });
  if (res.status !== 201) throw new Error(`feature setup failed: ${res.status} for ${slug}`);
}

describe("POST /api/v1/projects/:slug/features/:fSlug/archive (US-008 / T3)", () => {
  it("returns 204 for admin archiving an existing feature", async () => {
    const fSlug = `arc-ok-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    const res = await admin.post(`/api/v1/projects/${projectSlug}/features/${fSlug}/archive`);

    expect(res.status).toBe(204);
  });

  it("returns 401 UNAUTHENTICATED when no session", async () => {
    const fSlug = `arc-noauth-${Date.now()}`;
    await createFeature(fSlug);

    const res = await request(buildApp()).post(
      `/api/v1/projects/${projectSlug}/features/${fSlug}/archive`,
    );

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 FORBIDDEN for author (non-admin) role", async () => {
    const fSlug = `arc-author-${Date.now()}`;
    await createFeature(fSlug);

    const author = await loginAs("dev@local");
    const res = await author.post(`/api/v1/projects/${projectSlug}/features/${fSlug}/archive`);

    expect(res.status).toBe(403);
  });

  it("returns 404 FEATURE_NOT_FOUND for unknown feature slug", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin.post(
      `/api/v1/projects/${projectSlug}/features/does-not-exist-${Date.now()}/archive`,
    );

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FEATURE_NOT_FOUND");
  });

  it("is idempotent — second archive call still 204", async () => {
    const fSlug = `arc-idem-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    const first = await admin.post(`/api/v1/projects/${projectSlug}/features/${fSlug}/archive`);
    expect(first.status).toBe(204);

    const second = await admin.post(`/api/v1/projects/${projectSlug}/features/${fSlug}/archive`);
    expect(second.status).toBe(204);
  });

  it("removes archived feature from GET /projects/:slug feature list", async () => {
    const fSlug = `arc-listfilter-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    const before = await admin.get(`/api/v1/projects/${projectSlug}`);
    expect(before.body.data.features.map((f: { slug: string }) => f.slug)).toContain(fSlug);

    await admin.post(`/api/v1/projects/${projectSlug}/features/${fSlug}/archive`);

    const after = await admin.get(`/api/v1/projects/${projectSlug}`);
    expect(after.body.data.features.map((f: { slug: string }) => f.slug)).not.toContain(fSlug);
  });

  it("returns 404 on GET /projects/:slug/features/:fSlug after archive", async () => {
    const fSlug = `arc-getfilter-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    await admin.post(`/api/v1/projects/${projectSlug}/features/${fSlug}/archive`);

    const res = await admin.get(`/api/v1/projects/${projectSlug}/features/${fSlug}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FEATURE_NOT_FOUND");
  });
});
