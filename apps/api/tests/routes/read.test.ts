import { afterAll, beforeAll, describe, expect, it } from "vitest";
import session from "express-session";
import request from "supertest";
import { sql } from "drizzle-orm";
import { createApp } from "../../src/app.js";
import { createAuthRouter } from "../../src/routes/auth.js";
import { createProjectsRouter } from "../../src/routes/projects.js";
import { createFeaturesRouter } from "../../src/routes/features.js";
import { createSearchRouter } from "../../src/routes/search.js";
import { createUserRepo } from "../../src/repos/userRepo.js";
import { createProjectRepo } from "../../src/repos/projectRepo.js";
import { createFeatureRepo } from "../../src/repos/featureRepo.js";
import { createSearchRepo } from "../../src/repos/searchRepo.js";
import { createRateLimit, type RateLimitClient } from "../../src/middleware/rateLimit.js";
import { createRequireAuth } from "../../src/middleware/requireAuth.js";
import { requireAdmin } from "../../src/middleware/requireAdmin.js";
import { db } from "../../src/db/client.js";
import { pool } from "../../src/db.js";

/**
 * Integration tests for T7 read + search endpoints. Boots the real app
 * against seeded Postgres, authenticates via /auth/login once per test
 * via supertest.agent, then hits the read routes.
 */

function buildApp() {
  const userRepo = createUserRepo(db);
  const projectRepo = createProjectRepo(db);
  const featureRepo = createFeatureRepo(db);
  const searchRepo = createSearchRepo(db);

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
    featuresRouter: createFeaturesRouter({ featureRepo, projectRepo, requireAuth, requireAdmin }),
    searchRouter: createSearchRouter({ searchRepo, requireAuth }),
  });
}

async function authedAgent() {
  const agent = request.agent(buildApp());
  const res = await agent
    .post("/api/v1/auth/login")
    .send({ email: "admin@local", password: "dev12345" });
  if (res.status !== 200) throw new Error(`login failed in test setup: ${res.status}`);
  return agent;
}

beforeAll(async () => {
  await db.execute(sql`SELECT 1`);
});

afterAll(async () => {
  await pool.end();
});

describe("GET /projects/:slug", () => {
  it("returns project + feature list with filledCount=5 for seeded feature", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/projects/demo");

    expect(res.status).toBe(200);
    expect(res.body.data.project.slug).toBe("demo");
    expect(res.body.data.project.name).toBe("Demo Project");
    expect(Array.isArray(res.body.data.features)).toBe(true);

    const feat = res.body.data.features.find(
      (f: { slug: string }) => f.slug === "login-with-email",
    );
    expect(feat).toBeDefined();
    expect(feat.filledCount).toBe(5);
    expect(feat.title).toBeTruthy();
  });

  it("returns 404 PROJECT_NOT_FOUND for unknown slug", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/projects/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("returns 401 UNAUTHENTICATED without a session cookie", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/projects/demo");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("GET /projects/:slug/features/:featureSlug", () => {
  it("returns the feature with 5 sections in fixed order", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/projects/demo/features/login-with-email");

    expect(res.status).toBe(200);
    expect(res.body.data.feature.slug).toBe("login-with-email");

    const types = res.body.data.sections.map((s: { type: string }) => s.type);
    expect(types).toEqual(["business", "user-flow", "business-rules", "tech-notes", "screenshots"]);
  });

  it("includes updatedByName per section (JOIN users) when updatedBy set", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/projects/demo/features/login-with-email");
    expect(res.status).toBe(200);
    // Seed pins admin as updatedBy on every section → display name hydrated.
    for (const s of res.body.data.sections as Array<{
      type: string;
      updatedBy: string | null;
      updatedByName: string | null;
    }>) {
      if (s.updatedBy) {
        expect(s.updatedByName).toBeTruthy();
      } else {
        expect(s.updatedByName).toBeNull();
      }
    }
  });

  it("returns 404 FEATURE_NOT_FOUND when the feature slug does not exist", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/projects/demo/features/no-such-feature");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FEATURE_NOT_FOUND");
  });
});

describe("GET /search", () => {
  it("returns a feature hit with <mark> snippet for a term in seeded content (US-005 v2)", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/search").query({ q: "đăng" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      projects: expect.any(Array),
      features: expect.any(Array),
      sections: expect.any(Array),
      authors: expect.any(Array),
      uploads: expect.any(Array),
    });
    const feature = res.body.data.features.find(
      (f: { featureSlug: string }) => f.featureSlug === "login-with-email",
    );
    expect(feature).toBeDefined();
    expect(feature.snippet).toMatch(/<mark>.*<\/mark>/);
  });

  it("returns 400 SEARCH_QUERY_EMPTY when q is missing", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/search");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SEARCH_QUERY_EMPTY");
  });

  it("returns 200 with all-empty groups for a query that matches nothing (US-005 v2)", async () => {
    const agent = await authedAgent();
    const res = await agent.get("/api/v1/search").query({ q: "zzzzzzzzunmatch" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      projects: [],
      features: [],
      sections: [],
      authors: [],
      uploads: [],
    });
  });
});
