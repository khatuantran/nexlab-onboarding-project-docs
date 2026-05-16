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
  projectSlug = `us012-${Date.now()}`;
  CREATED_PROJECT_SLUGS.push(projectSlug);
  const res = await admin
    .post("/api/v1/projects")
    .send({ slug: projectSlug, name: "US-012 Host Project" });
  if (res.status !== 201) throw new Error(`project setup failed: ${res.status}`);
});

afterAll(async () => {
  if (CREATED_PROJECT_SLUGS.length > 0) {
    await db.delete(projects).where(inArray(projects.slug, CREATED_PROJECT_SLUGS));
  }
  await pool.end();
});

async function createFeature(slug: string, title = slug): Promise<void> {
  const admin = await loginAs("admin@local");
  const res = await admin.post(`/api/v1/projects/${projectSlug}/features`).send({ slug, title });
  if (res.status !== 201) throw new Error(`feature setup failed: ${res.status} for ${slug}`);
}

describe("PATCH /api/v1/projects/:slug/features/:fSlug (US-012 / T2)", () => {
  it("AC-1: admin updates title only → 200 + body reflects new title", async () => {
    const fSlug = `pt-title-${Date.now()}`;
    await createFeature(fSlug, "Original");

    const admin = await loginAs("admin@local");
    const res = await admin
      .patch(`/api/v1/projects/${projectSlug}/features/${fSlug}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated");
    expect(res.body.data.slug).toBe(fSlug);
  });

  it("AC-2: admin updates slug only → old slug 404, new slug 200", async () => {
    const fSlug = `pt-slug-${Date.now()}`;
    const newSlug = `pt-slug-renamed-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    const res = await admin
      .patch(`/api/v1/projects/${projectSlug}/features/${fSlug}`)
      .send({ slug: newSlug });
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(newSlug);

    const oldGet = await admin.get(`/api/v1/projects/${projectSlug}/features/${fSlug}`);
    expect(oldGet.status).toBe(404);

    const newGet = await admin.get(`/api/v1/projects/${projectSlug}/features/${newSlug}`);
    expect(newGet.status).toBe(200);
  });

  it("AC-3: admin updates both fields atomically", async () => {
    const fSlug = `pt-both-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    const newSlug = `pt-both-new-${Date.now()}`;
    const res = await admin
      .patch(`/api/v1/projects/${projectSlug}/features/${fSlug}`)
      .send({ title: "Combo", slug: newSlug });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Combo");
    expect(res.body.data.slug).toBe(newSlug);
  });

  it("AC-4: empty body → 400 VALIDATION_ERROR", async () => {
    const fSlug = `pt-empty-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    const res = await admin.patch(`/api/v1/projects/${projectSlug}/features/${fSlug}`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("AC-5: slug collision within same project → 409 FEATURE_SLUG_TAKEN", async () => {
    const a = `pt-conflict-a-${Date.now()}`;
    const b = `pt-conflict-b-${Date.now()}`;
    await createFeature(a);
    await createFeature(b);

    const admin = await loginAs("admin@local");
    const res = await admin
      .patch(`/api/v1/projects/${projectSlug}/features/${a}`)
      .send({ slug: b });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("FEATURE_SLUG_TAKEN");
  });

  it("AC-6: author (non-admin) → 403 FORBIDDEN", async () => {
    const fSlug = `pt-author-${Date.now()}`;
    await createFeature(fSlug);

    const author = await loginAs("dev@local");
    const res = await author
      .patch(`/api/v1/projects/${projectSlug}/features/${fSlug}`)
      .send({ title: "Nope" });

    expect(res.status).toBe(403);
  });

  it("AC-7: non-existent slug → 404 FEATURE_NOT_FOUND", async () => {
    const admin = await loginAs("admin@local");
    const res = await admin
      .patch(`/api/v1/projects/${projectSlug}/features/does-not-exist-${Date.now()}`)
      .send({ title: "x" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FEATURE_NOT_FOUND");
  });

  it("401 UNAUTHENTICATED when no session", async () => {
    const fSlug = `pt-noauth-${Date.now()}`;
    await createFeature(fSlug);

    const res = await request(buildApp())
      .patch(`/api/v1/projects/${projectSlug}/features/${fSlug}`)
      .send({ title: "x" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("invalid slug format → 400 VALIDATION_ERROR", async () => {
    const fSlug = `pt-badslug-${Date.now()}`;
    await createFeature(fSlug);

    const admin = await loginAs("admin@local");
    const res = await admin
      .patch(`/api/v1/projects/${projectSlug}/features/${fSlug}`)
      .send({ slug: "Bad Slug!" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
