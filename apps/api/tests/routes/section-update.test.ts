import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { and, eq, inArray } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createProjectsRouter } from "../../src/routes/projects.js";
import { createFeaturesRouter } from "../../src/routes/features.js";
import { createSectionsRouter } from "../../src/routes/sections.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createFeatureRepo } from "../../src/repos/featureRepo.js";
import { createSectionRepo } from "../../src/repos/sectionRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";
import { features, projects, sections } from "../../src/db/schema.js";

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);
  const featureRepo = createFeatureRepo(db);
  const sectionRepo = createSectionRepo(db);

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
    featuresRouter: createFeaturesRouter({ featureRepo, projectRepo, requireAuth }),
    sectionsRouter: createSectionsRouter({ sectionRepo, requireAuth }),
  });
}

async function loginAs(email: string) {
  const agent = request.agent(buildApp());
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} for ${email}`);
  return agent;
}

const projectSlug = `t5-host-${Date.now()}`;
let featureId = "";
let adminUserId = "";

beforeAll(async () => {
  const admin = await loginAs("admin@local");
  await admin.post("/api/v1/projects").send({ slug: projectSlug, name: "T5 Host" });
  const feat = await admin
    .post(`/api/v1/projects/${projectSlug}/features`)
    .send({ slug: `feat-${Date.now()}`, title: "Feat" });
  featureId = feat.body.data.id;
  const me = await admin.get("/api/v1/auth/me");
  adminUserId = me.body.data.user.id;
});

afterAll(async () => {
  await db.delete(projects).where(inArray(projects.slug, [projectSlug]));
  await pool.end();
});

describe("PUT /api/v1/features/:featureId/sections/:type", () => {
  it("updates target section body + metadata", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .put(`/api/v1/features/${featureId}/sections/business`)
      .send({ body: "# Business\n\nhello" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ type: "business", body: "# Business\n\nhello" });
    expect(res.body.data.updatedBy).toBe(adminUserId);
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it("leaves sibling sections unchanged", async () => {
    const agent = await loginAs("admin@local");
    // snapshot user-flow before
    const [before] = await db
      .select()
      .from(sections)
      .where(and(eq(sections.featureId, featureId), eq(sections.type, "user-flow")));

    await agent.put(`/api/v1/features/${featureId}/sections/business`).send({ body: "changed" });

    const [after] = await db
      .select()
      .from(sections)
      .where(and(eq(sections.featureId, featureId), eq(sections.type, "user-flow")));

    expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime());
    expect(after?.body).toBe(before?.body);
  });

  it("refreshes parent feature.updated_at", async () => {
    const agent = await loginAs("admin@local");
    const [before] = await db.select().from(features).where(eq(features.id, featureId));

    await new Promise((r) => setTimeout(r, 20));
    await agent
      .put(`/api/v1/features/${featureId}/sections/business-rules`)
      .send({ body: "rules" });

    const [after] = await db.select().from(features).where(eq(features.id, featureId));
    expect(after!.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
  });

  it("returns 413 SECTION_TOO_LARGE when body > 64 KiB", async () => {
    const agent = await loginAs("admin@local");
    const hugeBody = "a".repeat(65537); // 65537 bytes (ASCII)
    const res = await agent
      .put(`/api/v1/features/${featureId}/sections/business`)
      .send({ body: hugeBody });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("SECTION_TOO_LARGE");
  });

  it("allows empty body (clear section)", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .put(`/api/v1/features/${featureId}/sections/tech-notes`)
      .send({ body: "" });

    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe("");
  });

  it("returns 400 INVALID_SECTION_TYPE for unknown type", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent.put(`/api/v1/features/${featureId}/sections/bogus`).send({ body: "x" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_SECTION_TYPE");
  });

  it("returns 404 FEATURE_NOT_FOUND for unknown featureId", async () => {
    const agent = await loginAs("admin@local");
    const res = await agent
      .put(`/api/v1/features/00000000-0000-0000-0000-000000000000/sections/business`)
      .send({ body: "x" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FEATURE_NOT_FOUND");
  });

  it("returns 401 UNAUTHENTICATED when no session", async () => {
    const res = await request(buildApp())
      .put(`/api/v1/features/${featureId}/sections/business`)
      .send({ body: "x" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
